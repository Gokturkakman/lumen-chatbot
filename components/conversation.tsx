"use client";

import type { ChatStatus } from "ai";
import { useEffect, useRef } from "react";

import { AlertIcon, RefreshIcon } from "@/components/icons";
import { Message } from "@/components/message";
import type { ChatModel } from "@/lib/ai/models";
import { useI18n } from "@/lib/i18n";
import type { LumenMessage } from "@/lib/types";

export function Conversation({
  messages,
  status,
  error,
  models,
  onRetry,
}: {
  messages: LumenMessage[];
  status: ChatStatus;
  error: Error | undefined;
  models: ChatModel[];
  onRetry: () => void;
}) {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);

  /* Follow the stream, but stop the moment the user scrolls up to read. */
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    function onScroll() {
      if (!node) return;
      const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
      pinnedRef.current = distance < 120;
    }

    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (pinnedRef.current) {
      endRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  const last = messages.at(-1);
  const awaitingFirstToken =
    status === "submitted" && last?.role === "user";

  return (
    <div ref={scrollRef} className="scroll-slim min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[720px] px-5 pb-6 pt-8 sm:px-8">
        {messages.map((message, index) => (
          <Message
            key={message.id}
            message={message}
            models={models}
            isStreaming={
              status === "streaming" && index === messages.length - 1
            }
          />
        ))}

        {awaitingFirstToken && <Thinking label={t("message.thinking")} />}

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-rule bg-sunken px-4 py-3.5">
            <AlertIcon size={17} className="mt-px shrink-0 text-negative" />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium text-ink">
                {t("error.title")}
              </p>
              <p className="mt-0.5 break-words text-[12.5px] text-muted">
                {error.message}
              </p>
            </div>
            <button
              type="button"
              onClick={onRetry}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-rule bg-raised px-2.5 text-[12.5px] font-medium text-ink transition-colors hover:border-rule-strong"
            >
              <RefreshIcon size={13} />
              {t("error.retry")}
            </button>
          </div>
        )}

        <div ref={endRef} className="h-2" />
      </div>
    </div>
  );
}

function Thinking({ label }: { label: string }) {
  return (
    <div className="flex animate-[fade_0.3s_ease_both] items-center gap-2.5 py-2">
      <span className="flex gap-1">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-1.5 w-1.5 rounded-full bg-accent"
            style={{
              animation: "shimmer 1.2s ease-in-out infinite",
              animationDelay: `${index * 0.16}s`,
            }}
          />
        ))}
      </span>
      <span className="text-[13px] text-muted">{label}</span>
    </div>
  );
}
