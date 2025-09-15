import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const todoSchema = pgTable("todo", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  done: boolean("done").notNull().default(false),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
