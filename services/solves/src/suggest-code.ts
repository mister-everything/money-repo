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
import { z } from "zod";

/**
 * types.ts
 */

// ============================================================
// 주관식 문제 (Default/Short Answer)
// ============================================================
// 사용자가 직접 텍스트를 입력하여 답하는 문제 형태
// 예: "한국의 수도는?" → "서울"

/**
 * 주관식 문제 내용 스키마
 * @property type - 문제 타입 식별자 (항상 "default")
 * @property question - 문제 텍스트 (optional, ProbBlock 레벨에도 저장됨)
 */
export const defaultBlockContentSchema = z.object({
  type: z.literal("default"),
  question: z.string().optional(),
});

/**
 * 주관식 문제 정답 스키마
 * @property type - 문제 타입 식별자
 * @property answer - 정답 배열 (여러 표현 허용, 예: ["서울", "Seoul", "서울시"])
 */
export const defaultBlockAnswerSchema = z.object({
  type: z.literal("default"),
  answer: z.array(z.string()).min(1), // 최소 1개의 정답 필요
});

/**
 * 주관식 문제 답안 제출 스키마
 * @property type - 문제 타입 식별자
 * @property answer - 사용자가 제출한 답안 (단일 문자열)
 */
export const defaultBlockAnswerSubmitSchema = z.object({
  type: z.literal("default"),
  answer: z.string(),
});

// ============================================================
// 객관식 문제 (Multiple Choice Question)
// ============================================================
// 여러 선택지 중 하나 또는 여러 개를 선택하는 문제 형태
// 선택지는 텍스트 또는 이미지(source)로 표현 가능

/**
 * 객관식 문제 선택지 스키마
 * - source: 이미지/미디어 형태의 선택지 (예: 사진 중 하나 고르기)
 * - text: 텍스트 형태의 선택지 (일반적인 객관식)
 */
export const mcqBlockContentOptionSchema = z.union([
  z.object({
    type: z.literal("source"),
    mimeType: z.string(), // 예: "image/png", "image/jpeg"
    url: z.string().url(), // 미디어 URL
  }),
  z.object({
    type: z.literal("text"),
    text: z.string().min(1), // 선택지 텍스트
  }),
]);

/**
 * 객관식 문제 내용 스키마
 * @property type - 문제 타입 식별자 (항상 "mcq")
 * @property question - 문제 텍스트
 * @property options - 선택지 배열 (최소 2개 이상)
 */
export const mcqBlockContentSchema = z.object({
  type: z.literal("mcq"),
  question: z.string().optional(),
  options: mcqBlockContentOptionSchema.array().min(2), // 최소 2개의 선택지 필요
});

/**
 * 객관식 문제 정답 스키마
 * @property type - 문제 타입 식별자
 * @property answer - 정답 인덱스 배열 (0부터 시작, 복수 정답 가능)
 * @example [0] - 첫 번째 선택지가 정답
 * @example [0, 2] - 첫 번째와 세 번째 선택지가 모두 정답
 */
export const mcqBlockAnswerSchema = z.object({
  type: z.literal("mcq"),
  answer: z.array(z.number().int().min(0)).min(1), // 최소 1개의 정답 필요
});

/**
 * 객관식 문제 답안 제출 스키마
 * @property type - 문제 타입 식별자
 * @property answer - 사용자가 선택한 인덱스 배열 (복수 선택 가능)
 */
export const mcqBlockAnswerSubmitSchema = z.object({
  type: z.literal("mcq"),
  answer: z.array(z.number().int().min(0)), // 빈 배열 가능 (아무것도 선택 안함)
});

// ============================================================
// 순위 맞추기 문제 (Ranking)
// ============================================================
// 드래그 앤 드롭으로 아이템의 순서를 맞추는 게임형 문제
// 예: 전세계 부자 순위, 영화 흥행 순위, 역사적 사건 연대기 등

/**
 * 순위 맞추기 아이템 스키마
 * - text: 텍스트 기반 아이템 (예: 인물명, 제목)
 * - source: 미디어 기반 아이템 (예: 이미지, 비디오로 순위 맞추기)
 */
export const rankingBlockItemSchema = z.union([
  z.object({
    id: z.string(),
    type: z.literal("text"),
    label: z.string().min(1), // 텍스트 내용
  }),
  z.object({
    id: z.string(),
    type: z.literal("source"),
    mimeType: z.string(), // 미디어 타입 (예: "image/png", "video/mp4")
    url: z.string().url(), // 미디어 URL
  }),
]);

/**
 * 순위 맞추기 문제 내용 스키마
 * @property type - 문제 타입 식별자 (항상 "ranking")
 * @property question - 문제 텍스트
 * @property items - 순위를 맞출 아이템 배열 (최소 2개)
 */
export const rankingBlockContentSchema = z.object({
  type: z.literal("ranking"),
  question: z.string().optional(),
  items: rankingBlockItemSchema.array().min(2),
});

/**
 * 순위 맞추기 정답 스키마
 * @property type - 문제 타입 식별자
 * @property order - 정답 순서 (아이템 id 배열)
 * @example ["item3", "item1", "item2"] - 3번, 1번, 2번 순서가 정답
 */
export const rankingBlockAnswerSchema = z.object({
  type: z.literal("ranking"),
  order: z.array(z.string()).min(2), // 최소 2개
});

/**
 * 순위 맞추기 답안 제출 스키마
 * @property type - 문제 타입 식별자
 * @property order - 사용자가 정렬한 순서 (아이템 id 배열)
 */
export const rankingBlockAnswerSubmitSchema = z.object({
  type: z.literal("ranking"),
  order: z.array(z.string()),
});

// ============================================================
// OX 퀴즈 문제 (True/False)
// ============================================================
// O(참) 또는 X(거짓) 중 하나를 선택하는 문제
// 선택지는 텍스트 또는 이미지로 표현 가능

/**
 * OX 선택지 스키마
 * - source: 이미지 형태의 선택지
 * - text: 텍스트 형태의 선택지 (일반적으로 "O" 또는 "X")
 */
export const oxBlockOptionSchema = z.union([
  z.object({
    type: z.literal("source"),
    mimeType: z.string(),
    url: z.string().url(),
  }),
  z.object({
    type: z.literal("text"),
    text: z.string().min(1),
  }),
]);

/**
 * OX 퀴즈 문제 내용 스키마
 * @property type - 문제 타입 식별자 (항상 "ox")
 * @property question - 문제 텍스트
 * @property oOption - O(참) 선택지 표현
 * @property xOption - X(거짓) 선택지 표현
 */
export const oxBlockContentSchema = z.object({
  type: z.literal("ox"),
  question: z.string().optional(),
  oOption: oxBlockOptionSchema,
  xOption: oxBlockOptionSchema,
});

/**
 * OX 퀴즈 정답 스키마
 * @property type - 문제 타입 식별자
 * @property answer - 정답 ("o" 또는 "x")
 */
export const oxBlockAnswerSchema = z.object({
  type: z.literal("ox"),
  answer: z.enum(["o", "x"]),
});

/**
 * OX 퀴즈 답안 제출 스키마
 * @property type - 문제 타입 식별자
 * @property answer - 사용자가 선택한 답 ("o" 또는 "x")
 */
export const oxBlockAnswerSubmitSchema = z.object({
  type: z.literal("ox"),
  answer: z.enum(["o", "x"]),
});

// ============================================================
// 매칭 퀴즈 문제 (Matching)
// ============================================================
// 왼쪽과 오른쪽 아이템을 선으로 연결하는 게임형 문제
// 예: 나라-수도, 영단어-한글 뜻, 인물-업적 등

/**
 * 매칭 왼쪽 아이템 스키마
 * @property id - 아이템 고유 식별자
 * @property content - 아이템 내용/텍스트
 * @property imageUrl - 아이템 이미지 URL (선택)
 */
export const matchingBlockLeftItemSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
  imageUrl: z.string().url().optional(),
});

/**
 * 매칭 오른쪽 아이템 스키마
 * @property id - 아이템 고유 식별자
 * @property content - 아이템 내용/텍스트
 * @property imageUrl - 아이템 이미지 URL (선택)
 */
export const matchingBlockRightItemSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
  imageUrl: z.string().url().optional(),
});

/**
 * 매칭 퀴즈 문제 내용 스키마
 * @property type - 문제 타입 식별자 (항상 "matching")
 * @property question - 문제 텍스트
 * @property leftItems - 왼쪽 아이템 배열 (최소 2개)
 * @property rightItems - 오른쪽 아이템 배열 (최소 2개)
 */
export const matchingBlockContentSchema = z.object({
  type: z.literal("matching"),
  question: z.string().optional(),
  leftItems: matchingBlockLeftItemSchema.array().min(2),
  rightItems: matchingBlockRightItemSchema.array().min(2),
});

/**
 * 매칭 쌍 스키마
 * @property leftId - 왼쪽 아이템 id
 * @property rightId - 오른쪽 아이템 id
 */
export const matchingPairSchema = z.object({
  leftId: z.string(),
  rightId: z.string(),
});

/**
 * 매칭 퀴즈 정답 스키마
 * @property type - 문제 타입 식별자
 * @property pairs - 정답 쌍 배열
 * @example [{ leftId: "korea", rightId: "seoul" }, { leftId: "japan", rightId: "tokyo" }]
 */
export const matchingBlockAnswerSchema = z.object({
  type: z.literal("matching"),
  pairs: matchingPairSchema.array().min(1), // 최소 1쌍
});

/**
 * 매칭 퀴즈 답안 제출 스키마
 * @property type - 문제 타입 식별자
 * @property pairs - 사용자가 연결한 쌍 배열
 */
export const matchingBlockAnswerSubmitSchema = z.object({
  type: z.literal("matching"),
  pairs: matchingPairSchema.array(),
});

// ============================================================
// TypeScript 타입 정의
// ============================================================

/**
 * 주관식 문제 타입
 */
export type DefaultBlockContent = z.infer<typeof defaultBlockContentSchema>;
export type DefaultBlockAnswer = z.infer<typeof defaultBlockAnswerSchema>;
export type DefaultBlockAnswerSubmit = z.infer<
  typeof defaultBlockAnswerSubmitSchema
>;

/**
 * 객관식 문제 타입
 */
export type McqBlockContent = z.infer<typeof mcqBlockContentSchema>;
export type McqBlockAnswer = z.infer<typeof mcqBlockAnswerSchema>;
export type McqBlockAnswerSubmit = z.infer<typeof mcqBlockAnswerSubmitSchema>;

/**
 * 순위 맞추기 문제 타입
 */
export type RankingBlockContent = z.infer<typeof rankingBlockContentSchema>;
export type RankingBlockAnswer = z.infer<typeof rankingBlockAnswerSchema>;
export type RankingBlockAnswerSubmit = z.infer<
  typeof rankingBlockAnswerSubmitSchema
>;

/**
 * OX 퀴즈 문제 타입
 */
export type OxBlockContent = z.infer<typeof oxBlockContentSchema>;
export type OxBlockAnswer = z.infer<typeof oxBlockAnswerSchema>;
export type OxBlockAnswerSubmit = z.infer<typeof oxBlockAnswerSubmitSchema>;

/**
 * 매칭 퀴즈 문제 타입
 */
export type MatchingBlockContent = z.infer<typeof matchingBlockContentSchema>;
export type MatchingBlockAnswer = z.infer<typeof matchingBlockAnswerSchema>;
export type MatchingBlockAnswerSubmit = z.infer<
  typeof matchingBlockAnswerSubmitSchema
>;

/**
 * 모든 문제 타입의 Content Union
 * 새로운 문제 타입 추가 시 여기에도 추가해야 함
 */
export type ProbBlockContent =
  | DefaultBlockContent
  | McqBlockContent
  | RankingBlockContent
  | OxBlockContent
  | MatchingBlockContent;

/**
 * 모든 문제 타입의 Answer Union
 * 새로운 문제 타입 추가 시 여기에도 추가해야 함
 */
export type ProbBlockAnswer =
  | DefaultBlockAnswer
  | McqBlockAnswer
  | RankingBlockAnswer
  | OxBlockAnswer
  | MatchingBlockAnswer;

/**
 * 모든 문제 타입의 AnswerSubmit Union
 * 새로운 문제 타입 추가 시 여기에도 추가해야 함
 */
export type ProbBlockAnswerSubmit =
  | DefaultBlockAnswerSubmit
  | McqBlockAnswerSubmit
  | RankingBlockAnswerSubmit
  | OxBlockAnswerSubmit
  | MatchingBlockAnswerSubmit;

/**
 * 문제 블록 (단일 문제)
 * @property id - 문제 고유 ID (DB 자동 생성)
 * @property type - 문제 타입 (content.type과 동일, DB 검색 최적화를 위해 별도 컬럼)
 * @property question - 문제 텍스트 (content.question과 동일, DB 검색 최적화를 위해 별도 컬럼)
 * @property content - 문제 내용 (타입별로 다른 구조)
 * @property answer - 정답 (타입별로 다른 구조, 퀴즈 모드에서만 사용)
 * @property tags - 문제 태그 배열
 */
export type ProbBlock = {
  id: number; // serial (자동 증가)
  type: ProbBlockContent["type"];
  question?: string;
  content: ProbBlockContent;
  answer?: ProbBlockAnswer;
  tags: string[];
};

/**
 * 문제집 (여러 문제의 모음)
 * @property id - 문제집 고유 ID (DB 자동 생성)
 * @property title - 문제집 제목
 * @property description - 문제집 설명
 * @property blocks - 문제 블록 배열
 * @property tags - 문제집 태그 배열
 * @property isPublic - 공개 여부
 * @property ownerId - 문제집 소유자 ID
 * @property thumbnail - 썸네일 이미지 URL
 */
export type ProbBook = {
  id: number; // serial (자동 증가)
  title: string;
  description?: string;
  blocks: ProbBlock[];
  tags: string[];
  isPublic: boolean;
  ownerId: string; // 사용자 ID (auth 서비스 연동)
  thumbnail?: string;
};

/**
 * ============================================================
 * Mock 데이터 (예시 및 테스트용)
 * ============================================================
 */

/**
 * 주관식 문제 예시
 * 여러 가지 표현의 정답을 허용하는 예시
 */
export const MockDefaultBlock: ProbBlock = {
  id: 1,
  type: "default",
  question: "한국의 수도는?",
  content: {
    type: "default",
    question: "한국의 수도는?",
  },
  answer: {
    type: "default",
    answer: ["서울", "Seoul", "서울시"],
  },
  tags: ["한국", "수도"],
};

/**
 * 객관식 문제 예시
 * 이미지와 텍스트를 혼합한 선택지 예시
 */
export const MockMcqBlock: ProbBlock = {
  id: 2,
  type: "mcq",
  question: "한국의 수도는?",
  content: {
    type: "mcq",
    question: "한국의 수도는?",
    options: [
      {
        type: "source",
        mimeType: "image/png",
        url: "https://example.com/image.png",
      },
      {
        type: "text",
        text: "서울",
      },
      {
        type: "text",
        text: "부산",
      },
      {
        type: "text",
        text: "대구",
      },
    ],
  },
  answer: {
    type: "mcq",
    answer: [1],
  },
  tags: ["상식"],
};

/**
 * 순위 맞추기 문제 예시
 * 텍스트 기반 아이템으로 순서를 맞추는 게임형 문제
 */
export const MockRankingBlock: ProbBlock = {
  id: 3,
  type: "ranking",
  question: "전세계 부자 순위를 맞춰보세요 (2024년 기준)",
  content: {
    type: "ranking",
    question: "전세계 부자 순위를 맞춰보세요 (2024년 기준)",
    items: [
      {
        id: "elon",
        type: "text",
        label: "일론 머스크 (Tesla, SpaceX CEO)",
      },
      {
        id: "bezos",
        type: "text",
        label: "제프 베조스 (Amazon 창업자)",
      },
      {
        id: "arnault",
        type: "text",
        label: "베르나르 아르노 (LVMH 회장)",
      },
      {
        id: "gates",
        type: "text",
        label: "빌 게이츠 (Microsoft 창업자)",
      },
    ],
  },
  answer: {
    type: "ranking",
    order: ["arnault", "elon", "bezos", "gates"],
  },
  tags: ["경제", "인물"],
};

/**
 * 순위 맞추기 문제 예시 (미디어 기반)
 * 이미지로 된 아이템의 순서를 맞추는 문제
 */
export const MockRankingImageBlock: ProbBlock = {
  id: 6,
  type: "ranking",
  question: "2023년 영화 흥행 순위를 맞춰보세요 (포스터를 보고 순위 맞추기)",
  content: {
    type: "ranking",
    question: "2023년 영화 흥행 순위를 맞춰보세요 (포스터를 보고 순위 맞추기)",
    items: [
      {
        id: "barbie",
        type: "source",
        mimeType: "image/jpeg",
        url: "https://example.com/barbie.jpg",
      },
      {
        id: "oppenheimer",
        type: "source",
        mimeType: "image/jpeg",
        url: "https://example.com/oppenheimer.jpg",
      },
      {
        id: "mario",
        type: "source",
        mimeType: "image/jpeg",
        url: "https://example.com/mario.jpg",
      },
      {
        id: "guardian",
        type: "source",
        mimeType: "image/jpeg",
        url: "https://example.com/guardian.jpg",
      },
    ],
  },
  answer: {
    type: "ranking",
    order: ["barbie", "mario", "oppenheimer", "guardian"],
  },
  tags: ["영화", "대중문화"],
};

/**
 * OX 퀴즈 문제 예시
 * 참/거짓을 판단하는 문제
 */
export const MockOxBlock: ProbBlock = {
  id: 4,
  type: "ox",
  question: "지구는 평평하다?",
  content: {
    type: "ox",
    question: "지구는 평평하다?",
    oOption: {
      type: "text",
      text: "O (맞다)",
    },
    xOption: {
      type: "text",
      text: "X (틀리다)",
    },
  },
  answer: {
    type: "ox",
    answer: "x",
  },
  tags: ["과학", "상식"],
};

/**
 * 매칭 퀴즈 문제 예시
 * 선으로 연결하여 쌍을 맞추는 게임형 문제
 */
export const MockMatchingBlock: ProbBlock = {
  id: 5,
  type: "matching",
  question: "나라와 수도를 연결하세요",
  content: {
    type: "matching",
    question: "나라와 수도를 연결하세요",
    leftItems: [
      { id: "korea", content: "대한민국" },
      { id: "japan", content: "일본" },
      { id: "usa", content: "미국" },
      { id: "france", content: "프랑스" },
    ],
    rightItems: [
      { id: "seoul", content: "서울" },
      { id: "tokyo", content: "도쿄" },
      { id: "washington", content: "워싱턴 D.C." },
      { id: "paris", content: "파리" },
    ],
  },
  answer: {
    type: "matching",
    pairs: [
      { leftId: "korea", rightId: "seoul" },
      { leftId: "japan", rightId: "tokyo" },
      { leftId: "usa", rightId: "washington" },
      { leftId: "france", rightId: "paris" },
    ],
  },
  tags: ["지리", "상식"],
};

/**
 * 문제집 예시
 * 다양한 문제 타입을 포함한 문제집
 */
export const MockProbBook: ProbBook = {
  id: 1,
  title: "상식 퀴즈",
  description: "상식 퀴즈 문제 모음",
  ownerId: "user123", // 예시 사용자 ID
  blocks: [
    MockDefaultBlock,
    MockMcqBlock,
    MockRankingBlock,
    MockRankingImageBlock,
    MockOxBlock,
    MockMatchingBlock,
  ],
  tags: ["상식"],
  isPublic: true,
  thumbnail: "https://example.com/thumbnail.png",
};

/**
 * ============================================================
 * Database Schema (Drizzle ORM)
 * ============================================================
 */

// 스키마 네임스페이스 (PostgreSQL Schema)
const testSchema = pgSchema("test");

/**
 * 문제집 테이블
 * 문제들의 모음을 관리하는 테이블
 */
export const ProbBookTable = testSchema.table("prob_books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }), // 사용자 삭제 시 문제집도 삭제
  isPublic: boolean("is_public").default(false).notNull(),
  thumbnail: text("thumbnail"), // 썸네일 이미지 URL
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * 문제 블록 테이블
 * 개별 문제를 관리하는 테이블
 */
export const ProbBlockTable = testSchema.table("prob_blocks", {
  id: serial("id").primaryKey(),
  probBookId: integer("prob_book_id")
    .notNull()
    .references(() => ProbBookTable.id, { onDelete: "cascade" }), // 문제집 삭제 시 문제도 삭제
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
export const ProbBookSubmitTable = testSchema.table("prob_book_submits", {
  id: serial("id").primaryKey(),
  probBookId: integer("prob_book_id")
    .notNull()
    .references(() => ProbBookTable.id, { onDelete: "cascade" }), // 문제집 삭제 시 제출 기록도 삭제
  ownerId: text("owner_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }), // 사용자 삭제 시 제출 기록도 삭제
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
export const ProbBlockAnswerSubmitTable = testSchema.table(
  "prob_block_answer_submits",
  {
    blockId: integer("block_id")
      .notNull()
      .references(() => ProbBlockTable.id, { onDelete: "cascade" }), // 문제 삭제 시 답안도 삭제
    submitId: integer("submit_id")
      .notNull()
      .references(() => ProbBookSubmitTable.id, { onDelete: "cascade" }), // 세션 삭제 시 답안도 삭제
    answer: jsonb("answer").notNull().$type<ProbBlockAnswerSubmit>(), // 사용자 답안
    isCorrect: boolean("is_correct").notNull(), // 정답 여부 (성능 최적화를 위해 캐싱)
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.blockId, table.submitId] }), // 복합 키: 한 세션에서 문제당 하나의 답안
  ],
);

/**
 * 태그 마스터 테이블
 * 모든 태그를 중앙 관리 (정규화)
 */
export const tagsTable = testSchema.table("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // 태그명 (중복 불가)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * 문제집-태그 연결 테이블 (다대다 관계)
 * 문제집과 태그의 연결을 관리
 */
export const probBookTagsTable = testSchema.table(
  "prob_book_tags",
  {
    probBookId: integer("prob_book_id")
      .notNull()
      .references(() => ProbBookTable.id, { onDelete: "cascade" }), // 문제집 삭제 시 연결도 삭제
    tagId: integer("tag_id")
      .notNull()
      .references(() => tagsTable.id, { onDelete: "cascade" }), // 태그 삭제 시 연결도 삭제
  },
  (table) => [
    primaryKey({ columns: [table.probBookId, table.tagId] }), // 복합 키: 중복 방지
  ],
);

/**
 * ============================================================
 * Utility Functions (Type Guards & Validators)
 * ============================================================
 */

/**
 * Type Guard: 주관식 문제인지 확인
 */
export const isMaybeDefaultContent = (
  block: ProbBlockContent,
): block is DefaultBlockContent => {
  return block.type === "default";
};

/**
 * Type Guard: 객관식 문제인지 확인
 */
export const isMaybeMcqContent = (
  block: ProbBlockContent,
): block is McqBlockContent => {
  return block.type === "mcq";
};

/**
 * Type Guard: 순위 맞추기 문제인지 확인
 */
export const isMaybeRankingContent = (
  block: ProbBlockContent,
): block is RankingBlockContent => {
  return block.type === "ranking";
};

/**
 * Type Guard: OX 퀴즈 문제인지 확인
 */
export const isMaybeOxContent = (
  block: ProbBlockContent,
): block is OxBlockContent => {
  return block.type === "ox";
};

/**
 * Type Guard: 매칭 퀴즈 문제인지 확인
 */
export const isMaybeMatchingContent = (
  block: ProbBlockContent,
): block is MatchingBlockContent => {
  return block.type === "matching";
};

/**
 * ============================================================
 * Answer Checking Functions (답안 검증)
 * ============================================================
 */

/**
 * 메인 답안 체크 함수
 * 문제 타입에 따라 적절한 검증 함수를 호출
 *
 * @param correctAnswer - 정답
 * @param submittedAnswer - 사용자 제출 답안
 * @returns 정답 여부
 */
export const checkAnswer = (
  correctAnswer?: ProbBlockAnswer,
  submittedAnswer?: ProbBlockAnswerSubmit,
): boolean => {
  if (!correctAnswer || !submittedAnswer) return false;
  if (correctAnswer.type !== submittedAnswer.type) return false;

  switch (correctAnswer.type) {
    case "default":
      if (submittedAnswer.type !== "default") return false;
      return checkDefaultAnswer(correctAnswer, submittedAnswer);
    case "mcq":
      if (submittedAnswer.type !== "mcq") return false;
      return checkMcqAnswer(correctAnswer, submittedAnswer);
    case "ranking":
      if (submittedAnswer.type !== "ranking") return false;
      return checkRankingAnswer(correctAnswer, submittedAnswer);
    case "ox":
      if (submittedAnswer.type !== "ox") return false;
      return checkOxAnswer(correctAnswer, submittedAnswer);
    case "matching":
      if (submittedAnswer.type !== "matching") return false;
      return checkMatchingAnswer(correctAnswer, submittedAnswer);
    default:
      // 타입 시스템상 도달 불가능하지만, 런타임 안전성을 위해 유지
      throw new Error("정의되지 않은 문제 형태");
  }
};

/**
 * 주관식 답안 검증
 * 정답 목록 중 하나와 정확히 일치하면 정답 처리
 *
 * @param correctAnswer - 정답 객체 (여러 정답 가능)
 * @param submittedAnswer - 사용자 제출 답안
 * @returns 정답 여부
 *
 * @example
 * correctAnswer.answer = ["서울", "Seoul", "서울시"]
 * submittedAnswer.answer = "서울" → true
 * submittedAnswer.answer = "서울특별시" → false (정확히 일치하지 않음)
 */
export const checkDefaultAnswer = (
  correctAnswer: DefaultBlockAnswer,
  submittedAnswer: DefaultBlockAnswerSubmit,
): boolean => {
  const submitted = submittedAnswer.answer;
  return correctAnswer.answer.some((answer) => submitted === answer);
};

/**
 * 객관식 답안 검증
 * 선택한 개수와 내용이 모두 일치해야 정답 처리
 *
 * @param correctAnswer - 정답 객체 (인덱스 배열)
 * @param submittedAnswer - 사용자 제출 답안
 * @returns 정답 여부
 *
 * @example
 * correctAnswer.answer = [0, 2] (0번, 2번 선택지가 정답)
 * submittedAnswer.answer = [0, 2] → true
 * submittedAnswer.answer = [2, 0] → true (순서 무관)
 * submittedAnswer.answer = [0, 1, 2] → false (길이 다름)
 */
export const checkMcqAnswer = (
  correctAnswer: McqBlockAnswer,
  submittedAnswer: McqBlockAnswerSubmit,
): boolean => {
  const submitted = submittedAnswer.answer;
  return (
    submitted.length === correctAnswer.answer.length &&
    correctAnswer.answer.every((answer) => submitted.includes(answer))
  );
};

/**
 * 순위 맞추기 답안 검증
 * 순서가 정확히 일치해야 정답 처리
 *
 * @param correctAnswer - 정답 객체 (아이템 id 배열, 순서 중요)
 * @param submittedAnswer - 사용자 제출 답안
 * @returns 정답 여부
 *
 * @example
 * correctAnswer.order = ["item1", "item2", "item3"]
 * submittedAnswer.order = ["item1", "item2", "item3"] → true
 * submittedAnswer.order = ["item1", "item3", "item2"] → false (순서 다름)
 */
export const checkRankingAnswer = (
  correctAnswer: RankingBlockAnswer,
  submittedAnswer: RankingBlockAnswerSubmit,
): boolean => {
  const correct = correctAnswer.order;
  const submitted = submittedAnswer.order;

  if (correct.length !== submitted.length) return false;
  return correct.every((id, index) => id === submitted[index]);
};

/**
 * OX 퀴즈 답안 검증
 * "o" 또는 "x"가 정확히 일치하면 정답 처리
 *
 * @param correctAnswer - 정답 객체 ("o" 또는 "x")
 * @param submittedAnswer - 사용자 제출 답안
 * @returns 정답 여부
 */
export const checkOxAnswer = (
  correctAnswer: OxBlockAnswer,
  submittedAnswer: OxBlockAnswerSubmit,
): boolean => {
  return correctAnswer.answer === submittedAnswer.answer;
};

/**
 * 매칭 퀴즈 답안 검증
 * 모든 쌍이 정확히 일치해야 정답 처리 (순서 무관)
 *
 * @param correctAnswer - 정답 객체 (매칭 쌍 배열)
 * @param submittedAnswer - 사용자 제출 답안
 * @returns 정답 여부
 *
 * @example
 * correctAnswer.pairs = [
 *   { leftId: "korea", rightId: "seoul" },
 *   { leftId: "japan", rightId: "tokyo" }
 * ]
 * submittedAnswer.pairs가 동일하면 → true (순서 무관)
 * submittedAnswer.pairs = [{ leftId: "korea", rightId: "tokyo" }] → false
 */
export const checkMatchingAnswer = (
  correctAnswer: MatchingBlockAnswer,
  submittedAnswer: MatchingBlockAnswerSubmit,
): boolean => {
  const correctPairs = correctAnswer.pairs;
  const submittedPairs = submittedAnswer.pairs;

  if (correctPairs.length !== submittedPairs.length) return false;

  return correctPairs.every((correctPair) =>
    submittedPairs.some(
      (submittedPair) =>
        correctPair.leftId === submittedPair.leftId &&
        correctPair.rightId === submittedPair.rightId,
    ),
  );
};
