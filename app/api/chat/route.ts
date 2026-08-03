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
        // True character-by-character streaming: the regex matches a single
        // character, so smoothStream re-paces the provider's multi-token
        // chunks into one character every 5ms (~200 cps) instead of dumping
        // whole tokens at once.
        experimental_transform: smoothStream({
          delayInMs: 5,
          chunking: /[\s\S]/,
        }),
      });

      result.consumeStream();

      writer.merge(
        result.toUIMessageStream({
          sendReasoning: true,
          messageMetadata: () => ({
            modelId,
            createdAt: new Date().toISOString(),
          }),
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

    onError: (error) => {
      console.error("[chat]", error);
      return locale === "tr"
        ? "Bir şeyler ters gitti. Lütfen tekrar dene."
        : "Something went wrong. Please try again.";
    },
  });

  return createUIMessageStreamResponse({ stream });
}
