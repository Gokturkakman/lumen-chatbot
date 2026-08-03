import "server-only";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";

import { getModelById, TITLE_MODEL_ID, VIDEO_MODEL_ID } from "./models";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Maps a catalog id to a concrete provider model. Keeping the mapping here is
 * what makes adding a provider (OpenAI, Anthropic, OpenRouter…) a matter of
 * one import plus entries in models.ts.
 */
export function getLanguageModel(id: string): LanguageModel {
  const model = getModelById(id);
  if (!model) {
    throw new Error(`Unknown model: ${id}`);
  }

  switch (model.provider) {
    case "google":
      return google(model.modelId);
    case "groq":
      return groq(model.modelId);
    default: {
      const never: never = model.provider;
      throw new Error(`Unhandled provider: ${never}`);
    }
  }
}

export function getTitleModel(): LanguageModel {
  return getLanguageModel(TITLE_MODEL_ID);
}

/** Gemini is the only model here that can watch a video file directly. */
export function getVideoModel(): LanguageModel {
  return getLanguageModel(VIDEO_MODEL_ID);
}
