import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { getChatsByUserId } from "@/lib/db/queries";

export async function GET() {
  const session = await getSession();

  // No cookie yet means no chats yet — the guest row is created on first send.
  if (!session) {
    return NextResponse.json({ chats: [] });
  }

  const chats = await getChatsByUserId(session.userId);

  return NextResponse.json({
    chats: chats.map((chat) => ({
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    })),
  });
}
