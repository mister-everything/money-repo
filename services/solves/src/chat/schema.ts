import { userTable } from "@service/auth";
import { UIMessage } from "ai";
import { json, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { solvesSchema } from "../db";
import { probBooksTable } from "../prob/schema";
import { ChatMetadata } from "./types";

export const ChatThreadTable = solvesSchema.table("chat_thread", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  title: text("title").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date()),
});

export const ChatMessageTable = solvesSchema.table("chat_message", {
  id: text("id").primaryKey().notNull(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => ChatThreadTable.id, { onDelete: "cascade" }),
  role: text("role").notNull().$type<UIMessage["role"]>(),
  parts: json("parts").notNull().array().$type<UIMessage["parts"]>(),
  metadata: json("metadata").$type<ChatMetadata>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const WorkbookCreateChatThreadTable = solvesSchema.table(
  "workbook_create_chat_thread",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    workbookId: uuid("workbook_id")
      .notNull()
      .references(() => probBooksTable.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => ChatThreadTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
);
