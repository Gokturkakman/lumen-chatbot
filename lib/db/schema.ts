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
  email: varchar("email", { length: 128 }),
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
    id: uuid("id").primaryKey().notNull().defaultRandom(),
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
