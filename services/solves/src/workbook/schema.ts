import { userTable } from "@service/auth";
import {
  boolean,
  integer,
  jsonb,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { solvesSchema } from "../db";
import {
  BlockAnswer,
  BlockAnswerSubmit,
  BlockContent,
  BlockType,
} from "./blocks";

/**
 * 문제집 테이블
 * 문제들의 모음을 관리하는 테이블
 */
export const workBooksTable = solvesSchema.table("work_books", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  publishedAt: timestamp("published_at"),
});

/**
 * 문제 블록 테이블
 * 개별 문제를 관리하는 테이블
 */
export const blocksTable = solvesSchema.table("blocks", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  workBookId: uuid("work_book_id")
    .notNull()
    .references(() => workBooksTable.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0), // 문제 순서 (정렬용)
  type: text("type").$type<BlockType>().notNull(), // 문제 타입 (검색 최적화)
  question: text("question").notNull().default(""), // 문제 텍스트 (검색 최적화)
  content: jsonb("content").notNull().$type<BlockContent>(), // 문제 내용 (타입별 구조 다름)
  answer: jsonb("answer").$type<BlockAnswer>(), // 정답 (퀴즈 모드에서만 사용)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * 문제집 제출 테이블
 */
export const workBookSubmitsTable = solvesSchema.table("work_book_submits", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  workBookId: uuid("work_book_id")
    .notNull()
    .references(() => workBooksTable.id, { onDelete: "cascade" }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull().defaultNow(), // 시작 시간
  endTime: timestamp("end_time"), // 종료 시간 (진행 중이면 null)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  blockCount: integer("block_count"), // 제출 완료했을때 기준 문제 개수
});

/**
 * 문제 답안 제출 테이블
 * 각 문제에 대한 사용자의 답안을 관리
 * Composite Primary Key: (blockId, submitId) - 한 세션에서 각 문제당 하나의 답안만
 */
export const workBookBlockAnswerSubmitsTable = solvesSchema.table(
  "block_submits",
  {
    blockId: uuid("block_id")
      .notNull()
      .references(() => blocksTable.id, { onDelete: "cascade" }),
    submitId: uuid("submit_id")
      .notNull()
      .references(() => workBookSubmitsTable.id, { onDelete: "cascade" }),
    answer: jsonb("answer").notNull().$type<BlockAnswerSubmit>(), // 사용자 답안
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
  createdId: text("created_id").references(() => userTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * 문제집-태그 연결 테이블 (다대다 관계)
 * 문제집과 태그의 연결을 관리
 */
export const workBookTagsTable = solvesSchema.table(
  "work_book_tags",
  {
    workBookId: uuid("work_book_id")
      .notNull()
      .references(() => workBooksTable.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tagsTable.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.workBookId, table.tagId] })],
);

/**
 * 문제집 카테고리 대분류
 * 문제집의 소재 대분류 정보 저장
 */
export const categoryMainTable = solvesSchema.table("category_main", {
  id: serial("category_main_id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: varchar("description", { length: 300 }),
  aiPrompt: varchar("ai_prompt", { length: 300 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdId: text("created_id").references(() => userTable.id, {
    onDelete: "set null",
  }),
});

/**
 * 문제집 카테고리 중분류
 * 문제집의 소재 중분류 정보 저장
 */
export const categorySubTable = solvesSchema.table("category_sub", {
  id: serial("category_sub_id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  mainId: integer("category_main_id")
    .notNull()
    .references(() => categoryMainTable.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 300 }),
  aiPrompt: varchar("ai_prompt", { length: 300 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdId: text("created_id").references(() => userTable.id, {
    onDelete: "set null",
  }),
});

/**
 * 문제집 카테고리 연결 테이블
 * 문제집 생성 시 추가 필요
 */
export const workBookCategoryTable = solvesSchema.table(
  "work_book_category",
  {
    workBookId: uuid("work_book_id")
      .notNull()
      .references(() => workBooksTable.id, { onDelete: "cascade" }),
    categoryMainId: integer("category_main_id")
      .notNull()
      .references(() => categoryMainTable.id, { onDelete: "cascade" }),
    categorySubId: integer("category_sub_id")
      .notNull()
      .references(() => categorySubTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.workBookId, table.categoryMainId, table.categorySubId],
    }),
  ],
);
