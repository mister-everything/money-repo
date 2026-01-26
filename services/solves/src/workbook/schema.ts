import { userTable } from "@service/auth";
import {
  bigint,
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
 * 문제집 카테고리 테이블
 * parentId를 통한 무한 계층 구조 지원
 */
export const categoryTable = solvesSchema.table("category", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  parentId: integer("parent_id").references(() => categoryTable.id, {
    onDelete: "set null",
  }),
  description: varchar("description", { length: 300 }),
  aiPrompt: varchar("ai_prompt", { length: 300 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdId: text("created_id").references(() => userTable.id, {
    onDelete: "set null",
  }),
});

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
  likeCount: integer("like_count").default(0).notNull(),
  publishedAt: timestamp("published_at"),
  deletedAt: timestamp("deleted_at"),
  deletedReason: text("deleted_reason"),
  /**
   * 문제집 난이도(평균 점수) 집계용 누적 합계
   * - 점수는 각 유저의 "첫 제출 완료" 1개만 반영한다.
   * - 평균 점수는 (firstScoreSum / firstSolverCount)로 계산한다.
   */
  firstScoreSum: bigint("first_score_sum", { mode: "number" })
    .notNull()
    .default(0),
  /**
   * 문제집 난이도(평균 점수) 집계에 포함된 유저 수
   */
  firstSolverCount: bigint("first_solver_count", { mode: "number" })
    .notNull()
    .default(0),
  /**
   * 문제집 카테고리 (nullable)
   */
  categoryId: integer("category_id").references(() => categoryTable.id, {
    onDelete: "set null",
  }),
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
 * 제출 완료된 세션만 저장됨 (중간 저장 없음)
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
  endTime: timestamp("end_time").notNull().defaultNow(), // 종료 시간 (제출 완료 시점)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  blockCount: integer("block_count").notNull().default(0), // 제출 완료했을때 기준 문제 개수
  correctBlocks: integer("correct_blocks").notNull().default(0), // 정답 문제 개수
  active: boolean("active").notNull().default(false), // 활성 세션 여부 (문제집당 하나만 active)
});

export const workBookUserFirstScoresTable = solvesSchema.table(
  "work_book_user_first_scores",
  {
    workBookId: uuid("work_book_id")
      .notNull()
      .references(() => workBooksTable.id, { onDelete: "cascade" }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    /** 0~100 정수 점수 (정답률 %; round(correctBlocks * 100 / blockCount)) */
    score: integer("score").notNull().default(0),
    /** 어떤 제출이 '첫 제출'로 채택되었는지 추적 (디버깅/분쟁 대응용) */
    submitId: uuid("submit_id")
      .notNull()
      .references(() => workBookSubmitsTable.id, { onDelete: "cascade" }),
    firstSubmittedAt: timestamp("first_submitted_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.workBookId, t.ownerId] })],
);

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

export const WorkBookLikes = solvesSchema.table(
  "work_book_likes",
  {
    workBookId: uuid("work_book_id")
      .references(() => workBooksTable.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.workBookId, t.userId] })],
);

/**
 * 워크북 댓글 테이블
 * 댓글 + 대댓글(1-depth)을 단일 테이블로 관리
 */
export const workBookCommentsTable = solvesSchema.table("work_book_comments", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  workBookId: uuid("work_book_id")
    .notNull()
    .references(() => workBooksTable.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id").references((): any => workBookCommentsTable.id, {
    onDelete: "set null",
  }),
  authorId: text("author_id").references(() => userTable.id, {
    onDelete: "set null",
  }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  editedAt: timestamp("edited_at"),
  deletedAt: timestamp("deleted_at"),
  deletedReason: text("deleted_reason"),
});

/**
 * 워크북 댓글 좋아요 테이블
 * Composite PK로 중복 좋아요 방지
 */
export const workBookCommentLikesTable = solvesSchema.table(
  "work_book_comment_likes",
  {
    commentId: uuid("comment_id")
      .notNull()
      .references(() => workBookCommentsTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.commentId, t.userId] })],
);
