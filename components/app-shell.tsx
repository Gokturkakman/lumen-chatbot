"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { Composer, type Attachment } from "@/components/composer";
import { Conversation } from "@/components/conversation";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { Welcome } from "@/components/welcome";
import type { ChatModel } from "@/lib/ai/models";
import { useI18n } from "@/lib/i18n";
import type { ChatSummary, LumenMessage } from "@/lib/types";
import { cn, fetcher } from "@/lib/utils";

const MODEL_STORAGE_KEY = "lumen.model";
const SIDEBAR_STORAGE_KEY = "lumen.sidebar";

export type Account = { email: string | null; isGuest: boolean };

export function AppShell({
  chatId,
  initialMessages,
  models,
  account,
}: {
  chatId: string;
  initialMessages: LumenMessage[];
  models: ChatModel[];
  account: Account;
}) {
  const { t, locale } = useI18n();

  const [modelId, setModelId] = useState(models[0]?.id ?? "gemini-2.5-flash");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [text, setText] = useState("");
  // Suppresses the open/close transition on the very first paint, so the
  // mobile default doesn't animate shut in front of the user.
  const [mounted, setMounted] = useState(false);

  // Kept in a ref so the transport closure always reads the current value
  // without having to rebuild the transport on every change.
  const settings = useRef({ modelId, locale });
  settings.current = { modelId, locale };

  const {
    data: history,
    mutate: mutateHistory,
    isLoading: historyLoading,
  } = useSWR<{ chats: ChatSummary[] }>("/api/chats", fetcher, {
    revalidateOnFocus: false,
  });

  const transport = useMemo(
    () =>
      new DefaultChatTransport<LumenMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: {
            id,
            message: messages.at(-1),
            modelId: settings.current.modelId,
            locale: settings.current.locale,
          },
        }),
      }),
    []
  );

  const { messages, sendMessage, status, stop, regenerate, error } =
    useChat<LumenMessage>({
      id: chatId,
      messages: initialMessages,
      transport,
      onFinish: () => {
        void mutateHistory();
      },
      onError: (streamError) => {
        console.error(streamError);
        toast.error(streamError.message || t("message.error"));
      },
    });

  const isBusy = status === "submitted" || status === "streaming";
  const isEmpty = messages.length === 0;

  /* Restore persisted preferences. The sidebar starts closed on phones, where
     it is an overlay drawer rather than a column. */
  useEffect(() => {
    const storedModel = window.localStorage.getItem(MODEL_STORAGE_KEY);
    if (storedModel && models.some((model) => model.id === storedModel)) {
      setModelId(storedModel);
    }

    const storedSidebar = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    setSidebarOpen(storedSidebar === null ? isDesktop : storedSidebar !== "0");
    setMounted(true);
  }, [models]);

  const changeModel = useCallback((next: string) => {
    setModelId(next);
    window.localStorage.setItem(MODEL_STORAGE_KEY, next);
  }, []);

  /* On phones the sidebar covers the chat, so following a link must close it. */
  const closeOnMobile = useCallback(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) {
      setSidebarOpen(false);
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, open ? "0" : "1");
      return !open;
    });
  }, []);

  const submit = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed && attachments.length === 0) return;

      // The route creates the chat row on first message, so the URL can be
      // swapped in without a navigation that would unmount the stream.
      if (messages.length === 0) {
        window.history.replaceState(null, "", `/c/${chatId}`);
      }

      void sendMessage({
        role: "user",
        parts: [
          ...attachments.map((attachment) => ({
            type: "file" as const,
            mediaType: attachment.mediaType,
            filename: attachment.name,
            url: attachment.dataUrl,
          })),
          ...(trimmed ? [{ type: "text" as const, text: trimmed }] : []),
        ],
      });

      setAttachments([]);
      setText("");
    },
    [attachments, chatId, messages.length, sendMessage]
  );

  const prefill = useCallback((value: string) => setText(value), []);

  const activeModel = models.find((model) => model.id === modelId) ?? models[0];

  return (
    <div className="relative z-10 flex h-dvh overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        animate={mounted}
        onToggle={toggleSidebar}
        onNavigate={closeOnMobile}
        chats={history?.chats ?? []}
        loading={historyLoading}
        activeChatId={chatId}
        onMutate={mutateHistory}
        account={account}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          models={models}
          modelId={modelId}
          onModelChange={changeModel}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        <main
          className={cn(
            "relative flex min-h-0 flex-1 flex-col",
            isEmpty && "justify-center"
          )}
        >
          {isEmpty ? (
            <Welcome onPick={submit} onPrefill={prefill} />
          ) : (
            <Conversation
              messages={messages}
              status={status}
              error={error}
              models={models}
              onRetry={() => void regenerate()}
            />
          )}

          <Composer
            text={text}
            onTextChange={setText}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            onSubmit={submit}
            onStop={stop}
            busy={isBusy}
            centred={isEmpty}
            model={activeModel}
          />
        </main>
      </div>
    </div>
  );
}
