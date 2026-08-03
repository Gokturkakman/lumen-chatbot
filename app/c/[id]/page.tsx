import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getAvailableModels } from "@/lib/ai/models";
import { getSession } from "@/lib/auth/session";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import type { LumenMessage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) notFound();

  const chat = await getChatById(id);
  if (!chat || chat.userId !== session.userId) notFound();

  const rows = await getMessagesByChatId(id);

  const initialMessages: LumenMessage[] = rows.map((row) => ({
    id: row.id,
    role: row.role as LumenMessage["role"],
    parts: row.parts as LumenMessage["parts"],
    metadata: {
      modelId: row.modelId ?? undefined,
      createdAt: row.createdAt.toISOString(),
    },
  }));

  return (
    <AppShell
      chatId={id}
      initialMessages={initialMessages}
      models={getAvailableModels()}
      account={{ email: session.email, isGuest: session.isGuest }}
    />
  );
}
