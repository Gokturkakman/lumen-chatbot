import {
  boolean,
  index,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  // Null for guests. Postgres allows repeated NULLs under a unique index, so
  // this stops two accounts sharing an address without blocking guest rows.
  email: varchar("email", { length: 128 }).unique(),
  password: varchar("password", { length: 128 }),
  isGuest: boolean("isGuest").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type User = typeof user.$inferSelect;

export const chat = pgTable(
  "Chat",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [index("Chat_userId_updatedAt_idx").on(table.userId, table.updatedAt)]
);

export type Chat = typeof chat.$inferSelect;

export const message = pgTable(
  "Message",
  {
    // Not a uuid: the AI SDK mints these client-side as short opaque ids
    // (e.g. "Ko5yjldZrUtXDKWd"), and the same id must survive the round trip
    // so resuming a chat doesn't duplicate messages.
    id: varchar("id", { length: 64 }).primaryKey().notNull(),
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 16 }).notNull(),
    // UIMessage["parts"] — text, file (data URL images) and tool-* parts.
    parts: json("parts").notNull(),
    // Which model produced this message; null for user messages.
    modelId: varchar("modelId", { length: 64 }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [index("Message_chatId_createdAt_idx").on(table.chatId, table.createdAt)]
);

export type DBMessage = typeof message.$inferSelect;
