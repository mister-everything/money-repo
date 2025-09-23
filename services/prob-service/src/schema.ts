import {
  boolean,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AnswerMeta, styleFormat } from "./types";

// 문제집 테이블
export const probBookSchema = pgTable("prob_books", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 문제 테이블
export const probSchema = pgTable("probs", {
  id: text("id").primaryKey(),
  probBookId: text("prob_book_id")
    .notNull()
    .references(() => probBookSchema.id, { onDelete: "cascade" }),
  title: text("title"),
  style: text("style").$type<styleFormat>().notNull(),
  answerMeta: json("answer_meta").$type<AnswerMeta>().notNull(),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 문제 내용 테이블 (텍스트, 이미지, 비디오 등)
export const probContentSchema = pgTable("prob_contents", {
  id: serial("id").primaryKey(),
  probId: text("prob_id")
    .notNull()
    .references(() => probSchema.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // text, image, video, audio, mixed
  content: text("content").notNull(),
  url: text("url"),
  duration: integer("duration"), // for video/audio
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 문제 선택지 테이블
export const probOptionSchema = pgTable("prob_options", {
  id: serial("id").primaryKey(),
  probId: text("prob_id")
    .notNull()
    .references(() => probSchema.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // text, image, video, audio
  content: text("content").notNull(),
  url: text("url"),
  isCorrect: boolean("is_correct").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
