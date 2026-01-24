import { userTable } from "@service/auth";
import { text, timestamp, uuid } from "drizzle-orm/pg-core";
import { solvesSchema } from "../db";

export const CommunityCommentTable = solvesSchema.table("community_comment", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
