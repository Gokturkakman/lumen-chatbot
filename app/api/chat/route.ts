import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getModelById, resolveModelId } from "@/lib/ai/models";
import { systemPrompt, TITLE_PROMPT } from "@/lib/ai/prompts";
import { getLanguageModel, getTitleModel } from "@/lib/ai/providers";
import { chatTools } from "@/lib/ai/tools";
import { getOrCreateSession } from "@/lib/auth/session";
import {
  createChat,
  getChatById,
  getMessagesByChatId,
  renameChat,
  saveMessages,
  touchChat,
} from "@/lib/db/queries";
import type { LumenMessage } from "@/lib/types";

export const maxDuration = 120;

const bodySchema = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string(),
    role: z.literal("user"),
    parts: z.array(z.any()),
  }),
  modelId: z.string().optional(),
  locale: z.enum(["tr", "en"]).default("tr"),
});

type ApiErrorLike = {
  message?: string;
  statusCode?: number;
  data?: { error?: { message?: string } };
  cause?: unknown;
  lastError?: unknown;
  errors?: unknown[];
};

/**
 * The AI SDK wraps provider failures several layers deep — a retry wrapper
 * whose own message is just "An error occurred." holds the real
 * AI_APICallError in `lastError`/`errors[]`. Walk the chain and return the
 * first node that carries a status code or a provider message.
 */
function findApiError(error: unknown, depth = 0): ApiErrorLike | null {
  if (!error || typeof error !== "object" || depth > 4) return null;

  const node = error as ApiErrorLike;
  if (node.statusCode !== undefined || node.data?.error?.message) {
    return node;
  }

  for (const child of [node.lastError, node.cause, ...(node.errors ?? [])]) {
    const found = findApiError(child, depth + 1);
    if (found) return found;
  }

  return null;
}

function firstText(message: { parts: unknown[] }): string {
  for (const part of message.parts) {
    const candidate = part as { type?: string; text?: string };
    if (candidate?.type === "text" && typeof candidate.text === "string") {
      return candidate.text;
    }
  }
  return "";
}

async function generateTitle(text: string): Promise<string> {
  const fallback = text.slice(0, 60).trim() || "Yeni sohbet";
  try {
    const { text: title } = await generateText({
      model: getTitleModel(),
      system: TITLE_PROMPT,
      prompt: text.slice(0, 1000),
    });
    const cleaned = title.replace(/^["'«»]|["'«».]$/g, "").trim();
    return cleaned.slice(0, 80) || fallback;
  } catch {
    return fallback;
  }
}

export async function POST(request: Request) {
  let payload: z.infer<typeof bodySchema>;

  try {
    payload = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { id, message, locale } = payload;
  const session = await getOrCreateSession();

  const modelId = resolveModelId(payload.modelId);
  const model = getModelById(modelId);
  if (!model) {
    return NextResponse.json(
      { error: "No model provider is configured." },
      { status: 500 }
    );
  }

  /* ── Load or create the chat ─────────────────────────────────────── */

  const existing = await getChatById(id);
  let isNewChat = false;

  if (existing) {
    if (existing.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    isNewChat = true;
    await createChat({
      id,
      userId: session.userId,
      title: locale === "tr" ? "Yeni sohbet" : "New chat",
    });
  }

  const history = existing ? await getMessagesByChatId(id) : [];

  const priorMessages: LumenMessage[] = history.map((row) => ({
    id: row.id,
    role: row.role as LumenMessage["role"],
    parts: row.parts as LumenMessage["parts"],
    metadata: {
      modelId: row.modelId ?? undefined,
      createdAt: row.createdAt.toISOString(),
    },
  }));

  const userMessage = message as unknown as LumenMessage;
  const messages = [...priorMessages, userMessage];

  await saveMessages([
    {
      id: userMessage.id,
      chatId: id,
      role: "user",
      parts: userMessage.parts,
      modelId: null,
      createdAt: new Date(),
    },
  ]);

  /* ── Stream ──────────────────────────────────────────────────────── */

  // Both stream layers hand us a sanitised "An error occurred."; only
  // streamText's own onError carries the provider's real failure, so stash it
  // and read it back when composing the message the user actually sees.
  let providerError: unknown = null;

  // Captured here because TypeScript's narrowing of `model` doesn't survive
  // into a closure that runs later.
  const modelName = model.name;

  function describeError(error: unknown): string {
    const apiError = findApiError(providerError) ?? findApiError(error);
    const detail =
      apiError?.data?.error?.message ??
      apiError?.message ??
      (providerError as { message?: string })?.message ??
      (error as { message?: string })?.message;

    console.error(
      `[chat] model=${modelId} status=${apiError?.statusCode ?? "-"} ${
        detail ?? String(error)
      }`
    );

    // Gemini's free tier allows only 20 requests per day per model, so
    // hitting the cap mid-demo is likely. Say so, and point at the fix the
    // user can actually act on: another model in the picker.
    const quotaExhausted =
      apiError?.statusCode === 429 ||
      /quota|rate.?limit|RESOURCE_EXHAUSTED/i.test(detail ?? "");

    if (quotaExhausted) {
      const retryAfter = detail?.match(/retry in ([\d.]+)s/i)?.[1];
      const wait = retryAfter ? Math.ceil(Number(retryAfter)) : null;

      return locale === "tr"
        ? `${modelName} için günlük ücretsiz kota doldu.` +
            (wait ? ` ${wait} saniye sonra tekrar deneyebilirsin.` : "") +
            " Ya da üstteki menüden başka bir modele geç."
        : `The free daily quota for ${modelName} is used up.` +
            (wait ? ` You can retry in ${wait}s.` : "") +
            " Or switch to another model from the picker above.";
    }

    if (process.env.NODE_ENV !== "production" && detail) {
      return detail;
    }

    return locale === "tr"
      ? "Bir şeyler ters gitti. Lütfen tekrar dene."
      : "Something went wrong. Please try again.";
  }

  const stream = createUIMessageStream<LumenMessage>({
    execute: async ({ writer }) => {
      const result = streamText({
        model: getLanguageModel(modelId),
        system: systemPrompt({
          locale,
          modelName: model.name,
          hasVision: model.vision,
        }),
        messages: await convertToModelMessages(messages),
        tools: chatTools,
        stopWhen: stepCountIs(6),
        // A 429 here is a daily cap, not a blip — retrying just makes the user
        // wait ~30s for the same failure before seeing the message.
        maxRetries: 1,
        // True character-by-character streaming: the regex matches a single
        // character, so smoothStream re-paces the provider's multi-token
        // chunks into one character every 5ms (~200 cps) instead of dumping
        // whole tokens at once.
        experimental_transform: smoothStream({
          delayInMs: 5,
          chunking: /[\s\S]/,
        }),
        onError: ({ error }) => {
          providerError = error;
        },
      });

      result.consumeStream();

      writer.merge(
        result.toUIMessageStream({
          sendReasoning: true,
          messageMetadata: () => ({
            modelId,
            createdAt: new Date().toISOString(),
          }),
          // Without this the merged stream emits its own generic error part
          // before the outer handler ever runs.
          onError: describeError,
        })
      );
    },

    onFinish: async ({ responseMessage }) => {
      await saveMessages([
        {
          id: responseMessage.id,
          chatId: id,
          role: responseMessage.role,
          parts: responseMessage.parts,
          modelId,
          createdAt: new Date(),
        },
      ]);
      await touchChat(id);

      if (isNewChat) {
        const title = await generateTitle(firstText(userMessage));
        await renameChat({ id, userId: session.userId, title });
      }
    },

    onError: describeError,
  });

  return createUIMessageStreamResponse({ stream });
}
