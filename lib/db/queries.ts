import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "./client";
import { chat, message, user, type Chat, type DBMessage } from "./schema";

/* ── users ─────────────────────────────────────────────────────────── */

export async function createGuestUser() {
  const [created] = await db
    .insert(user)
    .values({ isGuest: true })
    .returning({ id: user.id, email: user.email, isGuest: user.isGuest });
  return created;
}

export async function getUserById(id: string) {
  const [found] = await db.select().from(user).where(eq(user.id, id)).limit(1);
  return found ?? null;
}

export async function getUserByEmail(email: string) {
  const [found] = await db
    .select()
    .from(user)
    .where(eq(user.email, email.toLowerCase()))
    .limit(1);
  return found ?? null;
}

/**
 * Turns the current guest row into a real account, so the chats the visitor
 * already created stay attached to them after signing up.
 */
export async function upgradeGuestToAccount({
  userId,
  email,
  passwordHash,
}: {
  userId: string;
  email: string;
  passwordHash: string;
}) {
  const [updated] = await db
    .update(user)
    .set({ email: email.toLowerCase(), password: passwordHash, isGuest: false })
    .where(eq(user.id, userId))
    .returning({ id: user.id, email: user.email, isGuest: user.isGuest });
  return updated;
}

/* ── chats ─────────────────────────────────────────────────────────── */

export async function createChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  const [created] = await db
    .insert(chat)
    .values({ id, userId, title })
    .returning();
  return created;
}

export async function getChatById(id: string): Promise<Chat | null> {
  const [found] = await db.select().from(chat).where(eq(chat.id, id)).limit(1);
  return found ?? null;
}

export async function getChatsByUserId(userId: string) {
  return await db
    .select({
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    })
    .from(chat)
    .where(eq(chat.userId, userId))
    .orderBy(desc(chat.updatedAt))
    .limit(100);
}

export async function renameChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  await db
    .update(chat)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(chat.id, id), eq(chat.userId, userId)));
}

export async function touchChat(id: string) {
  await db.update(chat).set({ updatedAt: new Date() }).where(eq(chat.id, id));
}

export async function deleteChat({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  await db.delete(chat).where(and(eq(chat.id, id), eq(chat.userId, userId)));
}

/* ── messages ──────────────────────────────────────────────────────── */

export async function saveMessages(
  messages: Array<{
    id: string;
    chatId: string;
    role: string;
    parts: unknown;
    modelId?: string | null;
    createdAt: Date;
  }>
) {
  if (messages.length === 0) return;
  await db.insert(message).values(messages).onConflictDoNothing();
}

export async function getMessagesByChatId(
  chatId: string
): Promise<DBMessage[]> {
  return await db
    .select()
    .from(message)
    .where(eq(message.chatId, chatId))
    .orderBy(asc(message.createdAt));
}
