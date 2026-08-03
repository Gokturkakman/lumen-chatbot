/**
 * Model health check.
 *
 *   npx tsx scripts/check-models.mts
 *
 * Providers retire model ids without deprecation windows — Google pulled the
 * entire Gemini 2.5 line from new API keys, Groq dropped Llama 4 Scout and
 * Kimi K2 — and a stale id fails only at request time, in front of the user.
 * This drives every entry in CHAT_MODELS through a real tool-calling stream so
 * the catalog is verified rather than assumed.
 *
 * Providers are constructed here rather than imported from lib/ai/providers,
 * which is marked server-only and cannot load outside Next.
 */
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { streamText, stepCountIs, tool, type LanguageModel } from "ai";
import { config } from "dotenv";
import { z } from "zod";

config({ path: ".env.local" });

import {
  CHAT_MODELS,
  TITLE_MODEL_ID,
  VIDEO_MODEL_ID,
  isProviderConfigured,
  type ChatModel,
} from "../lib/ai/models";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

function resolve(model: ChatModel): LanguageModel {
  return model.provider === "google"
    ? google(model.modelId)
    : groq(model.modelId);
}

/** Stand-in for the real tools: same shape, no network. */
const probeTool = tool({
  description: "Get the current temperature in a city.",
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }) => ({ city, celsius: 21 }),
});

type Outcome = { model: ChatModel; ok: boolean; note: string };

async function probe(model: ChatModel): Promise<Outcome> {
  try {
    const result = streamText({
      model: resolve(model),
      system: "Use the tool when asked about weather. Be brief.",
      messages: [
        { role: "user", content: "What's the temperature in Istanbul?" },
      ],
      tools: { getTemperature: probeTool },
      stopWhen: stepCountIs(3),
    });

    let text = "";
    let calledTool = false;

    for await (const part of result.fullStream) {
      if (part.type === "text-delta") text += part.text;
      if (part.type === "tool-call") calledTool = true;
      if (part.type === "error") {
        const error = part.error as { data?: { error?: { message?: string } } };
        const message =
          error?.data?.error?.message ?? String(part.error).slice(0, 110);
        return { model, ok: false, note: message.slice(0, 110) };
      }
    }

    if (!text.trim()) {
      return { model, ok: false, note: "streamed no text" };
    }

    return {
      model,
      ok: true,
      note: `${calledTool ? "tools ok" : "NO TOOL CALL"}, ${text.trim().length} chars`,
    };
  } catch (error) {
    return { model, ok: false, note: String(error).slice(0, 110) };
  }
}

const configured = CHAT_MODELS.filter((model) =>
  isProviderConfigured(model.provider)
);
const skipped = CHAT_MODELS.length - configured.length;

console.log(`\nProbing ${configured.length} models${skipped ? ` (${skipped} skipped, no API key)` : ""}\n`);

// Groq's Llama 3.3 occasionally rejects an otherwise valid tool schema
// ("Failed to call a function"), so one retry separates a flaky model from a
// dead model id.
const outcomes = await Promise.all(
  configured.map(async (model) => {
    const first = await probe(model);
    return first.ok ? first : await probe(model);
  })
);
let failures = 0;

for (const { model, ok, note } of outcomes) {
  if (!ok) failures++;
  console.log(
    `  ${ok ? "ok  " : "FAIL"}  ${model.provider.padEnd(7)} ${model.modelId.padEnd(34)} ${note}`
  );
}

for (const id of [TITLE_MODEL_ID, VIDEO_MODEL_ID]) {
  const found = CHAT_MODELS.some((model) => model.id === id);
  if (!found) {
    failures++;
    console.log(`  FAIL  special   ${id.padEnd(34)} not present in CHAT_MODELS`);
  }
}

console.log(
  failures === 0
    ? "\nEvery model in the catalog answers and calls tools.\n"
    : `\n${failures} model(s) need attention.\n`
);
process.exit(failures === 0 ? 0 : 1);
