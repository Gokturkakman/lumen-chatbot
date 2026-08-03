export type Provider = "google" | "groq";

export type ChatModel = {
  id: string;
  /** The id passed to the provider SDK. */
  modelId: string;
  provider: Provider;
  name: string;
  /** Short label shown under the name in the picker. */
  tagline: { tr: string; en: string };
  vision: boolean;
  /** Marks models that trade quality for latency. */
  fast?: boolean;
  /** Marks models that expose a thinking/reasoning budget. */
  reasoning?: boolean;
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  google: "Google Gemini",
  groq: "Groq",
};

/**
 * Every entry here is verified against the live provider APIs by
 * `npm run check:models` — model availability shifts under you (Google retired
 * the whole Gemini 2.5 line for new keys, Groq dropped Llama 4 Scout and Kimi
 * K2), so re-run that script rather than trusting a docs page.
 *
 * Gemini Pro and the 2.x line are deliberately absent: they answer 429 on the
 * free tier, and a model that always errors is worse than one that isn't listed.
 */
export const CHAT_MODELS: ChatModel[] = [
  {
    id: "gemini-3.6-flash",
    modelId: "gemini-3.6-flash",
    provider: "google",
    name: "Gemini 3.6 Flash",
    tagline: {
      tr: "Dengeli varsayılan — görsel + araç desteği",
      en: "Balanced default — vision + tools",
    },
    vision: true,
  },
  {
    id: "gemini-3.5-flash",
    modelId: "gemini-3.5-flash",
    provider: "google",
    name: "Gemini 3.5 Flash",
    tagline: {
      tr: "Uzun cevaplarda daha ayrıntılı",
      en: "More thorough on long answers",
    },
    vision: true,
  },
  {
    id: "gemini-3.5-flash-lite",
    modelId: "gemini-3.5-flash-lite",
    provider: "google",
    name: "Gemini 3.5 Flash Lite",
    tagline: {
      tr: "En hızlı Gemini — kısa sorular için",
      en: "Fastest Gemini — for short questions",
    },
    vision: true,
    fast: true,
  },
  {
    id: "gemini-3.1-flash-lite",
    modelId: "gemini-3.1-flash-lite",
    provider: "google",
    name: "Gemini 3.1 Flash Lite",
    tagline: {
      tr: "Önceki nesil — karşılaştırma için",
      en: "Previous generation — for comparison",
    },
    vision: true,
    fast: true,
  },
  {
    id: "llama-3.3-70b",
    modelId: "llama-3.3-70b-versatile",
    provider: "groq",
    name: "Llama 3.3 70B",
    tagline: {
      tr: "Meta'nın açık ağırlıklı modeli — çok hızlı",
      en: "Meta's open-weight model — very fast",
    },
    vision: false,
  },
  {
    id: "gpt-oss-120b",
    modelId: "openai/gpt-oss-120b",
    provider: "groq",
    name: "GPT-OSS 120B",
    tagline: {
      tr: "OpenAI'ın açık ağırlıklı modeli",
      en: "OpenAI's open-weight model",
    },
    vision: false,
    reasoning: true,
  },
  {
    id: "qwen3.6-27b",
    modelId: "qwen/qwen3.6-27b",
    provider: "groq",
    name: "Qwen 3.6 27B",
    tagline: {
      tr: "Alibaba'nın modeli — farklı bir bakış",
      en: "Alibaba's model — a different take",
    },
    vision: false,
  },
  {
    id: "llama-3.1-8b",
    modelId: "llama-3.1-8b-instant",
    provider: "groq",
    name: "Llama 3.1 8B",
    tagline: {
      tr: "Anlık cevap — en küçük model",
      en: "Instant answers — smallest model",
    },
    vision: false,
    fast: true,
  },
];

export const DEFAULT_MODEL_ID = "gemini-3.6-flash";

/** Cheap model used for auto-titling chats. */
export const TITLE_MODEL_ID = "gemini-3.5-flash-lite";

/** Only Gemini can be handed a YouTube URL and actually watch the video. */
export const VIDEO_MODEL_ID = "gemini-3.6-flash";

export function isProviderConfigured(provider: Provider): boolean {
  if (provider === "google") {
    return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  }
  return Boolean(process.env.GROQ_API_KEY);
}

/** Only the models whose provider actually has an API key configured. */
export function getAvailableModels(): ChatModel[] {
  return CHAT_MODELS.filter((model) => isProviderConfigured(model.provider));
}

export function getModelById(id: string): ChatModel | undefined {
  return CHAT_MODELS.find((model) => model.id === id);
}

export function resolveModelId(requested: string | undefined): string {
  const available = getAvailableModels();
  if (available.length === 0) return DEFAULT_MODEL_ID;

  const match = available.find((model) => model.id === requested);
  if (match) return match.id;

  const preferred = available.find((model) => model.id === DEFAULT_MODEL_ID);
  return (preferred ?? available[0]).id;
}
