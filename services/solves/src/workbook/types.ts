import z from "zod";
import { BlockAnswer, BlockContent, BlockType } from "./blocks";
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

export type UpdateBlock<T extends BlockType = BlockType> = {
  id: string;
} & Partial<Omit<WorkBookBlock<T>, "id" | "type">>;

// 풀이 모드에서 사용하는 문제 블록
export type WorkBookBlockWithoutAnswer = Omit<WorkBookBlock, "answer">;

/**
 * 문제집 (여러 문제의 모음)
 */
export type WorkBook = {
  id: string;
  title: string;
  description?: string | null;
  blocks: WorkBookBlock[];
  tags: { id: number; name: string }[];
  isPublic: boolean;
  ownerName: string;
  ownerProfile?: string | null;
  createdAt: Date;
  publishedAt?: Date | null;
};

/**
 * 문제집 (여러 문제의 모음) 사용하지 않음.
 */
export type WorkBookWithoutBlocks = Omit<WorkBook, "blocks">;

export type WorkBookWithoutAnswer = WorkBookWithoutBlocks & {
  blocks: WorkBookBlockWithoutAnswer[];
};

export const createWorkBookSchema = z.object({
  ownerId: z.string(),
  title: z.string(),
});
export type CreateWorkBook = z.infer<typeof createWorkBookSchema>;

export type SessionNotStarted = {
  status: "not-started";
};

export type SessionInProgress = {
  status: "in-progress";
  startTime: Date;
  submitId: string;
};

export type SessionSubmitted = {
  status: "submitted";
  startTime: Date;
  submitId: string;
  endTime: Date;
  totalBlocks: number;
  correctBlocks: number;
};
export type SessionStatus =
  | SessionNotStarted
  | SessionInProgress
  | SessionSubmitted;
