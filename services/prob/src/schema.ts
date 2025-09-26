import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { styleFormat } from "./types";

// 태그 테이블
export const tagSchema = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 문제집 테이블 (JSON 제거)
export const probBookSchema = pgTable("prob_books", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 문제집-태그 관계 테이블
export const probBookTagSchema = pgTable(
  "prob_book_tags",
  {
    probBookId: text("prob_book_id")
      .notNull()
      .references(() => probBookSchema.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tagSchema.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.probBookId, table.tagId] }),
  }),
);

// 문제 테이블 (JSON 제거)
export const probSchema = pgTable("probs", {
  id: text("id").primaryKey(),
  probBookId: text("prob_book_id")
    .notNull()
    .references(() => probBookSchema.id, { onDelete: "cascade" }),
  title: text("title"),
  style: text("style").$type<styleFormat>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 문제-태그 관계 테이블
export const probTagSchema = pgTable(
  "prob_tags",
  {
    probId: text("prob_id")
      .notNull()
      .references(() => probSchema.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tagSchema.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.probId, table.tagId] }),
  }),
);

// 정답 메타데이터 테이블 (JSON 대신 정규화)
export const probAnswerMetaSchema = pgTable("prob_answer_meta", {
  probId: text("prob_id")
    .primaryKey()
    .references(() => probSchema.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // "objective" | "subjective"

  // objective 전용 필드들
  multiple: boolean("multiple"),
  randomized: boolean("randomized"),

  // subjective 전용 필드들
  charLimit: integer("char_limit"),
  lines: integer("lines"),
  placeholder: text("placeholder"),
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

// 문제 선택지 테이블 (정답 처리 개선)
export const probOptionSchema = pgTable("prob_options", {
  id: serial("id").primaryKey(),
  probId: text("prob_id")
    .notNull()
    .references(() => probSchema.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // text, image, video, audio
  content: text("content").notNull(),
  url: text("url"),
  isCorrect: boolean("is_correct").notNull().default(false),
  correctOrder: integer("correct_order"), // 복수정답일 때 순서
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
