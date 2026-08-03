import type { InferUITools, UIDataTypes, UIMessage } from "ai";

import type { chatTools } from "./ai/tools";

export type ChatTools = InferUITools<typeof chatTools>;

export type LumenMessage = UIMessage<
  { modelId?: string; createdAt?: string },
  UIDataTypes,
  ChatTools
>;

export type ChatSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type Locale = "tr" | "en";
