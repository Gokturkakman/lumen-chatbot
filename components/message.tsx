"use client";

import { useState } from "react";

import { CheckIcon, ChevronDownIcon, CopyIcon } from "@/components/icons";
import { Markdown } from "@/components/markdown";
import { ToolPart, type ToolPartType } from "@/components/tools/tool-part";
import type { ChatModel } from "@/lib/ai/models";
import { useI18n } from "@/lib/i18n";
import type { LumenMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

function isToolPart(
  part: LumenMessage["parts"][number]
): part is ToolPartType {
  return part.type.startsWith("tool-");
}

export function Message({
  message,
  models,
  isStreaming,
}: {
  message: LumenMessage;
  models: ChatModel[];
  isStreaming: boolean;
}) {
  return message.role === "user" ? (
    <UserMessage message={message} />
  ) : (
    <AssistantMessage
      message={message}
      models={models}
      isStreaming={isStreaming}
    />
  );
}

/* ── User ──────────────────────────────────────────────────────────── */

function UserMessage({ message }: { message: LumenMessage }) {
  const images = message.parts.filter(
    (part): part is Extract<LumenMessage["parts"][number], { type: "file" }> =>
      part.type === "file" && part.mediaType.startsWith("image/")
  );

  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text: string }).text)
    .join("\n\n");

  return (
    <article className="mb-8 flex animate-rise flex-col items-end">
      {images.length > 0 && (
        <div className="mb-2 flex max-w-[85%] flex-wrap justify-end gap-2">
          {images.map((image, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${image.url.slice(-24)}-${index}`}
              src={image.url}
              alt={image.filename ?? ""}
              className="max-h-64 rounded-xl border border-rule object-cover shadow-card"
            />
          ))}
        </div>
      )}

      {text && (
        <div className="max-w-[85%] rounded-2xl rounded-br-md border border-accent-rule bg-accent-wash px-4 py-2.5">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
            {text}
          </p>
        </div>
      )}
    </article>
  );
}

/* ── Assistant ─────────────────────────────────────────────────────── */

function AssistantMessage({
  message,
  models,
  isStreaming,
}: {
  message: LumenMessage;
  models: ChatModel[];
  isStreaming: boolean;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const plainText = message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text: string }).text)
    .join("\n\n");

  const modelName =
    models.find((model) => model.id === message.metadata?.modelId)?.name ??
    message.metadata?.modelId;

  function copy() {
    void navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  // The caret belongs on the final text part only, and only while it grows.
  const lastTextIndex = message.parts.reduce(
    (last, part, index) => (part.type === "text" ? index : last),
    -1
  );

  return (
    <article className="group/msg mb-9 animate-rise">
      {message.parts.map((part, index) => {
        const key = `${message.id}-${index}`;

        if (part.type === "text") {
          return (
            <div
              key={key}
              className={cn(
                index > 0 && "mt-4",
                isStreaming && index === lastTextIndex && "caret-host"
              )}
            >
              <Markdown>{part.text}</Markdown>
            </div>
          );
        }

        if (part.type === "reasoning" && part.text.trim()) {
          return (
            <Reasoning key={key} text={part.text} label={t("message.reasoning")} />
          );
        }

        if (isToolPart(part)) {
          return <ToolPart key={key} part={part} />;
        }

        return null;
      })}

      {/* Footer actions — revealed on hover so they never compete with prose. */}
      {!isStreaming && plainText && (
        <div className="mt-3 flex items-center gap-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover/msg:opacity-100">
          <button
            type="button"
            onClick={copy}
            className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11.5px] font-medium text-faint transition-colors hover:bg-sunken hover:text-ink"
          >
            {copied ? (
              <>
                <CheckIcon size={12} className="text-positive" />
                {t("message.copied")}
              </>
            ) : (
              <>
                <CopyIcon size={12} />
                {t("message.copy")}
              </>
            )}
          </button>

          {modelName && (
            <span className="text-[11px] text-faint">· {modelName}</span>
          )}
        </div>
      )}
    </article>
  );
}

function Reasoning({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-rule bg-sunken/60">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left"
      >
        <ChevronDownIcon
          size={13}
          className={cn(
            "shrink-0 text-faint transition-transform duration-200",
            !open && "-rotate-90"
          )}
        />
        <span className="eyebrow">{label}</span>
      </button>

      {open && (
        <div className="border-t border-rule px-3.5 py-3">
          <p className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-muted">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}
