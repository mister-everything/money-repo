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
export type WorkBookBlock<T extends BlockType = BlockType> = {
  id: string; // uuid
  question: string;
  type: T;
  content: BlockContent<T>;
  answer: BlockAnswer<T>;
  order: number;
};

// 풀이 모드에서 사용하는 문제 블록
export type WorkBookBlockWithoutAnswer = Omit<WorkBookBlock, "answer">;

/**
 * 문제집 (여러 문제의 모음)
 */
export type WorkBook = {
  id: string;
  title: string;
  description?: string;
  blocks: WorkBookBlock[];
  tags: string[];
  isPublic: boolean;
  owner: Owner;
  thumbnail?: string;
  createdAt: Date;
};

/**
 * 문제집 (여러 문제의 모음) 사용하지 않음.
 */
export type WorkBookWithoutBlocks = Omit<WorkBook, "blocks">;

export type WorkBookWithoutAnswer = WorkBookWithoutBlocks & {
  blocks: WorkBookBlockWithoutAnswer[];
};

export const allContentSchemas = z.union(
  Object.values(All_BLOCKS).map((block) => block.contentSchema),
) as z.ZodType<BlockContent>;

export const allAnswerSchemas = z.union(
  Object.values(All_BLOCKS).map((block) => block.answerSchema),
) as z.ZodType<BlockAnswer>;
export const allAnswerSubmitSchemas = z.union(
  Object.values(All_BLOCKS).map((block) => block.answerSubmitSchema),
) as z.ZodType<BlockAnswerSubmit>;

export const createWorkBookSchema = z.object({
  ownerId: z.string(),
  title: z.string(),
});
export type CreateWorkBook = z.infer<typeof createWorkBookSchema>;

/**
 * probBlockAnswerSubmitsTable에 대응하는 타입
 */
export type WorkBookBlockAnswerSubmitRecord = {
  blockId: string;
  submitId: string;
  answer: BlockAnswerSubmit;
  isCorrect: boolean;
  createdAt: Date;
};

/**
 * 세션 시작/재개 응답 타입
 */
export type WorkBookSubmitSession = {
  submitId: string;
  startTime: Date;
  savedAnswers: Record<string, BlockAnswerSubmit>;
};

/**
 * 문제집 제출 결과 타입
 */
export type SubmitWorkBookResponse = {
  score: number;
  correctAnswerIds: string[];
  totalProblems: number;
  blockResults: Array<{
    blockId: string;
    answer: BlockAnswer;
  }>;
};

export type WorkBookInProgress = WorkBookWithoutBlocks & {
  startTime: Date;
};

export type WorkBookCompleted = WorkBookWithoutBlocks & {
  startTime: Date;
  endTime: Date;
  score: number;
  totalProblems: number;
};
