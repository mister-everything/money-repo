import { userTable } from "@service/auth";
import {
  boolean,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { SCHEMA_NAME } from "./const";
import type {
  ProbBlockAnswer,
  ProbBlockAnswerSubmit,
  ProbBlockContent,
} from "./types";

export const solvesSchema = pgSchema(SCHEMA_NAME);

/**
 * 문제집 테이블
 * 문제들의 모음을 관리하는 테이블
 */
export const probBooksTable = solvesSchema.table("prob_books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  isPublic: boolean("is_public").default(false).notNull(),
  thumbnail: text("thumbnail"), // 썸네일 이미지 URL
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * 문제 블록 테이블
 * 개별 문제를 관리하는 테이블
 */
export const probBlocksTable = solvesSchema.table("prob_blocks", {
  id: serial("id").primaryKey(),
  probBookId: integer("prob_book_id")
    .notNull()
    .references(() => probBooksTable.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0), // 문제 순서 (정렬용)
  type: text("type").notNull(), // 문제 타입 (검색 최적화)
  question: text("question"), // 문제 텍스트 (검색 최적화)
  content: jsonb("content").notNull().$type<ProbBlockContent>(), // 문제 내용 (타입별 구조 다름)
  answer: jsonb("answer").$type<ProbBlockAnswer>(), // 정답 (퀴즈 모드에서만 사용)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * 문제집 제출 세션 테이블
 * 사용자가 문제집을 푸는 세션을 관리 (한 번의 시도)
 */
export const probBookSubmitsTable = solvesSchema.table("prob_book_submits", {
  id: serial("id").primaryKey(),
  probBookId: integer("prob_book_id")
    .notNull()
    .references(() => probBooksTable.id, { onDelete: "cascade" }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(), // 시작 시간
  endTime: timestamp("end_time"), // 종료 시간 (진행 중이면 null)
  totalQuestions: integer("total_questions").notNull(), // 전체 문제 수
  correctCount: integer("correct_count").notNull().default(0), // 맞은 문제 수
  score: integer("score").notNull().default(0), // 총점
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * 문제 답안 제출 테이블
 * 각 문제에 대한 사용자의 답안을 관리
 * Composite Primary Key: (blockId, submitId) - 한 세션에서 각 문제당 하나의 답안만
 */
export const probBlockAnswerSubmitsTable = solvesSchema.table(
  "prob_block_answer_submits",
  {
    blockId: integer("block_id")
      .notNull()
      .references(() => probBlocksTable.id, { onDelete: "cascade" }),
    submitId: integer("submit_id")
      .notNull()
      .references(() => probBookSubmitsTable.id, { onDelete: "cascade" }),
    answer: jsonb("answer").notNull().$type<ProbBlockAnswerSubmit>(), // 사용자 답안
    isCorrect: boolean("is_correct").notNull(), // 정답 여부
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.blockId, table.submitId] })],
);

/**
 * 태그 마스터 테이블
 * 모든 태그를 중앙 관리 (정규화)
 */
export const tagsTable = solvesSchema.table("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * 문제집-태그 연결 테이블 (다대다 관계)
 * 문제집과 태그의 연결을 관리
 */
export const probBookTagsTable = solvesSchema.table(
  "prob_book_tags",
  {
    probBookId: integer("prob_book_id")
      .notNull()
      .references(() => probBooksTable.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tagsTable.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.probBookId, table.tagId] })],
);
