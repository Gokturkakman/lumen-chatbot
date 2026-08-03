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

export const CHAT_MODELS: ChatModel[] = [
  {
    id: "gemini-2.5-flash",
    modelId: "gemini-2.5-flash",
    provider: "google",
    name: "Gemini 2.5 Flash",
    tagline: {
      tr: "Dengeli varsayılan — görsel + araç desteği",
      en: "Balanced default — vision + tools",
    },
    vision: true,
  },
  {
    id: "gemini-2.5-pro",
    modelId: "gemini-2.5-pro",
    provider: "google",
    name: "Gemini 2.5 Pro",
    tagline: {
      tr: "En güçlü akıl yürütme, daha yavaş",
      en: "Strongest reasoning, slower",
    },
    vision: true,
    reasoning: true,
  },
  {
    id: "gemini-2.5-flash-lite",
    modelId: "gemini-2.5-flash-lite",
    provider: "google",
    name: "Gemini 2.5 Flash Lite",
    tagline: {
      tr: "En hızlı ve en ucuz Gemini",
      en: "Fastest, cheapest Gemini",
    },
    vision: true,
    fast: true,
  },
  {
    id: "gemini-2.0-flash",
    modelId: "gemini-2.0-flash",
    provider: "google",
    name: "Gemini 2.0 Flash",
    tagline: {
      tr: "Önceki nesil — karşılaştırma için",
      en: "Previous generation — for comparison",
    },
    vision: true,
  },
  {
    id: "llama-4-scout",
    modelId: "meta-llama/llama-4-scout-17b-16e-instruct",
    provider: "groq",
    name: "Llama 4 Scout",
    tagline: {
      tr: "Meta'nın açık ağırlıklı görsel modeli",
      en: "Meta's open-weight vision model",
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
      tr: "Çok hızlı metin modeli (görsel yok)",
      en: "Very fast text model (no vision)",
    },
    vision: false,
    fast: true,
  },
  {
    id: "kimi-k2",
    modelId: "moonshotai/kimi-k2-instruct-0905",
    provider: "groq",
    name: "Kimi K2",
    tagline: {
      tr: "Araç kullanımında güçlü, 1T parametre",
      en: "Strong at tool use, 1T parameters",
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
];

export const DEFAULT_MODEL_ID = "gemini-2.5-flash";

/** Cheap model used for auto-titling chats. */
export const TITLE_MODEL_ID = "gemini-2.5-flash-lite";

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
