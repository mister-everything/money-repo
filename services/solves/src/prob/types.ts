import { Owner } from "@service/auth/shared";
import z from "zod";
import {
  All_BLOCKS,
  BlockAnswer,
  BlockAnswerSubmit,
  BlockContent,
  BlockType,
} from "./blocks";
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
export type ProbBlock<T extends BlockType = BlockType> = {
  id: string; // uuid
  question?: string;
  type: T;
  content: BlockContent<T>;
  answer?: BlockAnswer<T>;
  order: number;
};

// 풀이 모드에서 사용하는 문제 블록
export type ProbBlockWithoutAnswer = Omit<ProbBlock, "answer">;

/**
 * 문제집 (여러 문제의 모음)
 */
export type ProbBook = {
  id: string; // uuid
  title: string;
  description?: string;
  blocks: ProbBlockWithoutAnswer[];
  tags: string[];
  isPublic: boolean;
  owner: Owner;
  thumbnail?: string;
};

export type ProbBookWithoutBlocks = Omit<ProbBook, "blocks">;

export const allContentSchemas = z.union(
  Object.values(All_BLOCKS).map((block) => block.contentSchema),
) as z.ZodType<BlockContent>;

export const allAnswerSchemas = z.union(
  Object.values(All_BLOCKS).map((block) => block.answerSchema),
) as z.ZodType<BlockAnswer>;

export const allAnswerSubmitSchemas = z.union(
  Object.values(All_BLOCKS).map((block) => block.answerSubmitSchema),
) as z.ZodType<BlockAnswerSubmit>;

export const createProbBookSchema = z.object({
  ownerId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false).optional(),
  thumbnail: z.string().optional(),
});
export type CreateProbBook = z.infer<typeof createProbBookSchema>;

export const createProbBlockSchema = z.object({
  probBookId: z.uuid(),
  ownerId: z.string(),
  order: z.number(),
  question: z.string().optional(),
  type: z.enum(Object.keys(All_BLOCKS) as [BlockType, ...BlockType[]]),
  content: allContentSchemas,
  answer: allAnswerSchemas,
});
export type CreateProbBlock = z.infer<typeof createProbBlockSchema>;

/**
 * probBookSubmitsTable에 대응하는 타입
 */
export type ProbBookSubmit = {
  id: string;
  probBookId: string;
  ownerId: string;
  startTime: Date;
  endTime: Date | null;
  score: number;
};

/**
 * probBlockAnswerSubmitsTable에 대응하는 타입
 */
export type ProbBlockAnswerSubmitRecord = {
  blockId: string;
  submitId: string;
  answer: BlockAnswerSubmit;
  isCorrect: boolean;
  createdAt: Date;
};

/**
 * 세션 시작/재개 응답 타입
 */
export type ProbBookSubmitSession = {
  submitId: string;
  startTime: Date;
  savedAnswers: Record<string, BlockAnswerSubmit>;
};

/**
 * 문제집 제출 결과 타입
 */
export type SubmitProbBookResponse = {
  score: number;
  correctAnswerIds: string[];
  totalProblems: number;
  blockResults: Array<{
    blockId: string;
    answer: BlockAnswer;
  }>;
};
