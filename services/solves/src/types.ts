import { z } from "zod";

// ============================================================
// 주관식 문제 (Default/Short Answer)
// ============================================================

/**
 * 주관식 문제 내용 스키마
 */
export const defaultBlockContentSchema = z.object({
  type: z.literal("default"),
  question: z.string().optional(),
});

/**
 * 주관식 문제 정답 스키마
 */
export const defaultBlockAnswerSchema = z.object({
  type: z.literal("default"),
  answer: z.array(z.string()).min(1),
});

/**
 * 주관식 문제 답안 제출 스키마
 */
export const defaultBlockAnswerSubmitSchema = z.object({
  type: z.literal("default"),
  answer: z.string(),
});

// ============================================================
// 객관식 문제 (Multiple Choice Question)
// ============================================================

/**
 * 객관식 문제 선택지 스키마
 */
export const mcqBlockContentOptionSchema = z.union([
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
 * 객관식 문제 내용 스키마
 */
export const mcqBlockContentSchema = z.object({
  type: z.literal("mcq"),
  question: z.string().optional(),
  options: mcqBlockContentOptionSchema.array().min(2),
});

/**
 * 객관식 문제 정답 스키마
 */
export const mcqBlockAnswerSchema = z.object({
  type: z.literal("mcq"),
  answer: z.array(z.number().int().min(0)).min(1),
});

/**
 * 객관식 문제 답안 제출 스키마
 */
export const mcqBlockAnswerSubmitSchema = z.object({
  type: z.literal("mcq"),
  answer: z.array(z.number().int().min(0)),
});

// ============================================================
// 순위 맞추기 문제 (Ranking)
// ============================================================

/**
 * 순위 맞추기 아이템 스키마
 */
export const rankingBlockItemSchema = z.union([
  z.object({
    id: z.string(),
    type: z.literal("text"),
    label: z.string().min(1),
  }),
  z.object({
    id: z.string(),
    type: z.literal("source"),
    mimeType: z.string(),
    url: z.string().url(),
  }),
]);

/**
 * 순위 맞추기 문제 내용 스키마
 */
export const rankingBlockContentSchema = z.object({
  type: z.literal("ranking"),
  question: z.string().optional(),
  items: rankingBlockItemSchema.array().min(2),
});

/**
 * 순위 맞추기 정답 스키마
 */
export const rankingBlockAnswerSchema = z.object({
  type: z.literal("ranking"),
  order: z.array(z.string()).min(2),
});

/**
 * 순위 맞추기 답안 제출 스키마
 */
export const rankingBlockAnswerSubmitSchema = z.object({
  type: z.literal("ranking"),
  order: z.array(z.string()),
});

// ============================================================
// OX 퀴즈 문제 (True/False)
// ============================================================

/**
 * OX 선택지 스키마
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
 */
export const oxBlockContentSchema = z.object({
  type: z.literal("ox"),
  question: z.string().optional(),
  oOption: oxBlockOptionSchema,
  xOption: oxBlockOptionSchema,
});

/**
 * OX 퀴즈 정답 스키마
 */
export const oxBlockAnswerSchema = z.object({
  type: z.literal("ox"),
  answer: z.enum(["o", "x"]),
});

/**
 * OX 퀴즈 답안 제출 스키마
 */
export const oxBlockAnswerSubmitSchema = z.object({
  type: z.literal("ox"),
  answer: z.enum(["o", "x"]),
});

// ============================================================
// 매칭 퀴즈 문제 (Matching)
// ============================================================

/**
 * 매칭 왼쪽 아이템 스키마
 */
export const matchingBlockLeftItemSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
  imageUrl: z.string().url().optional(),
});

/**
 * 매칭 오른쪽 아이템 스키마
 */
export const matchingBlockRightItemSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
  imageUrl: z.string().url().optional(),
});

/**
 * 매칭 퀴즈 문제 내용 스키마
 */
export const matchingBlockContentSchema = z.object({
  type: z.literal("matching"),
  question: z.string().optional(),
  leftItems: matchingBlockLeftItemSchema.array().min(2),
  rightItems: matchingBlockRightItemSchema.array().min(2),
});

/**
 * 매칭 쌍 스키마
 */
export const matchingPairSchema = z.object({
  leftId: z.string(),
  rightId: z.string(),
});

/**
 * 매칭 퀴즈 정답 스키마
 */
export const matchingBlockAnswerSchema = z.object({
  type: z.literal("matching"),
  pairs: matchingPairSchema.array().min(1),
});

/**
 * 매칭 퀴즈 답안 제출 스키마
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
 */
export type ProbBlockContent =
  | DefaultBlockContent
  | McqBlockContent
  | RankingBlockContent
  | OxBlockContent
  | MatchingBlockContent;

/**
 * 모든 문제 타입의 Answer Union
 */
export type ProbBlockAnswer =
  | DefaultBlockAnswer
  | McqBlockAnswer
  | RankingBlockAnswer
  | OxBlockAnswer
  | MatchingBlockAnswer;

/**
 * 모든 문제 타입의 AnswerSubmit Union
 */
export type ProbBlockAnswerSubmit =
  | DefaultBlockAnswerSubmit
  | McqBlockAnswerSubmit
  | RankingBlockAnswerSubmit
  | OxBlockAnswerSubmit
  | MatchingBlockAnswerSubmit;

/**
 * 태그 타입
 */
export type Tag = {
  id: number;
  name: string;
  createdAt: Date;
};

/**
 * 문제 블록 (단일 문제)
 */
export type ProbBlock = {
  id: number; // serial (자동 증가)
  type: ProbBlockContent["type"];
  question?: string;
  content: ProbBlockContent;
  answer?: ProbBlockAnswer;
  order?: number;
  tags: string[];
};

/**
 * 문제집 (여러 문제의 모음)
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
 * 문제집 제출 세션
 */
export type ProbBookSubmit = {
  id: number;
  probBookId: number;
  ownerId: string;
  startTime: Date;
  endTime?: Date;
  totalQuestions: number;
  correctCount: number;
  score: number;
  createdAt: Date;
};

/**
 * 문제 답안 제출
 */
export type ProbBlockAnswerSubmitRecord = {
  blockId: number;
  submitId: number;
  answer: ProbBlockAnswerSubmit;
  isCorrect: boolean;
  createdAt: Date;
};

/**
 * 저장용 문제집 타입 (태그는 문자열 배열로 받아서 내부에서 정규화)
 */
export type ProbBookSaveInput = {
  id?: number;
  ownerId: string;
  title: string;
  description?: string;
  blocks: ProbBlockSaveInput[];
  tags?: string[];
  isPublic?: boolean;
  thumbnail?: string;
};

/**
 * 저장용 문제 블록 타입
 */
export type ProbBlockSaveInput = {
  id?: number;
  type: ProbBlockContent["type"];
  question?: string;
  content: ProbBlockContent;
  answer?: ProbBlockAnswer;
  tags?: string[];
  order?: number;
};

/**
 * 개별 문제 블록 생성/수정 타입 (문제집 ID 포함)
 */
export type ProbBlockCreateInput = {
  probBookId: number;
  type: ProbBlockContent["type"];
  question?: string;
  content: ProbBlockContent;
  answer?: ProbBlockAnswer;
  order?: number;
};

export type ProbBlockUpdateInput = {
  id: number;
  type?: ProbBlockContent["type"];
  question?: string;
  content?: ProbBlockContent;
  answer?: ProbBlockAnswer;
  order?: number;
};

// ============================================================
// Zod 스키마 정의 (API 검증용)
// ============================================================

/**
 * 문제집 저장 스키마 (API 요청 검증용)
 */
export const probBookSaveSchema = z.object({
  id: z.number().optional(),
  ownerId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  blocks: z.array(
    z.object({
      id: z.number().optional(),
      type: z.enum(["default", "mcq", "ranking", "ox", "matching"]),
      question: z.string().optional(),
      content: z.union([
        defaultBlockContentSchema,
        mcqBlockContentSchema,
        rankingBlockContentSchema,
        oxBlockContentSchema,
        matchingBlockContentSchema,
      ]),
      answer: z
        .union([
          defaultBlockAnswerSchema,
          mcqBlockAnswerSchema,
          rankingBlockAnswerSchema,
          oxBlockAnswerSchema,
          matchingBlockAnswerSchema,
        ])
        .optional(),
      tags: z.array(z.string()).optional(),
      order: z.number().optional(),
    }),
  ),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  thumbnail: z.string().optional(),
});

/**
 * 문제 답안 제출 스키마 (API 요청 검증용)
 */
export const probBlockAnswerSubmitApiSchema = z.union([
  defaultBlockAnswerSubmitSchema,
  mcqBlockAnswerSubmitSchema,
  rankingBlockAnswerSubmitSchema,
  oxBlockAnswerSubmitSchema,
  matchingBlockAnswerSubmitSchema,
]);

/**
 * 개별 문제 블록 생성 스키마 (API 요청 검증용)
 */
export const probBlockCreateSchema = z.object({
  probBookId: z.number(),
  type: z.enum(["default", "mcq", "ranking", "ox", "matching"]),
  question: z.string().optional(),
  content: z.union([
    defaultBlockContentSchema,
    mcqBlockContentSchema,
    rankingBlockContentSchema,
    oxBlockContentSchema,
    matchingBlockContentSchema,
  ]),
  answer: z
    .union([
      defaultBlockAnswerSchema,
      mcqBlockAnswerSchema,
      rankingBlockAnswerSchema,
      oxBlockAnswerSchema,
      matchingBlockAnswerSchema,
    ])
    .optional(),
  order: z.number().optional(),
});

/**
 * 개별 문제 블록 수정 스키마 (API 요청 검증용)
 */
export const probBlockUpdateSchema = z.object({
  type: z.enum(["default", "mcq", "ranking", "ox", "matching"]).optional(),
  question: z.string().optional(),
  content: z
    .union([
      defaultBlockContentSchema,
      mcqBlockContentSchema,
      rankingBlockContentSchema,
      oxBlockContentSchema,
      matchingBlockContentSchema,
    ])
    .optional(),
  answer: z
    .union([
      defaultBlockAnswerSchema,
      mcqBlockAnswerSchema,
      rankingBlockAnswerSchema,
      oxBlockAnswerSchema,
      matchingBlockAnswerSchema,
    ])
    .optional(),
  order: z.number().optional(),
});

// ============================================================
// Utility Functions 재export (prob-utils에서 import)
// ============================================================

// 타입 가드와 답안 검증 함수들은 prob/prob-utils.ts로 이동
export {
  checkAnswer,
  checkDefaultAnswer,
  checkMatchingAnswer,
  checkMcqAnswer,
  checkOxAnswer,
  checkRankingAnswer,
  isDefaultContent,
  isMatchingContent,
  isMcqContent,
  isOxContent,
  isRankingContent,
} from "./prob/prob-utils";
