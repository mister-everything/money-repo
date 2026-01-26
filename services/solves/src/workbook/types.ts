import {
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
  likeCount: number;
  description?: string | null;
  blocks: WorkBookBlock[];
  tags: { id: number; name: string }[];
  isPublic: boolean;
  ownerName?: string | null;
  ownerPublicId: number;
  ownerProfile?: string | null;
  isAdmin?: boolean;
  createdAt: Date;
  publishedAt?: Date | null;
  categoryId?: number | null;
  /**
   * 난이도(평균 점수) 표시에 필요한 통계값
   * - solverCount < 10 이면 UI에서 "새로운 문제집"으로 표시
   * - avgScore는 (sum/count)에서 round한 정수(0~100)
   */
  firstSolverCount?: number;
  firstScoreSum?: number;
};

/**
 * 문제집 (여러 문제의 모음) 사용하지 않음.
 */
export type WorkBookWithoutBlocks = Omit<WorkBook, "blocks">;

export type WorkBookWithoutAnswer = WorkBookWithoutBlocks & {
  blocks: WorkBookBlockWithoutAnswer[];
};

export type SessionNotStarted = {
  status: "not-started";
};

export type SessionSubmitted = {
  status: "submitted";
  startTime: Date;
  submitId: string;
  endTime: Date;
  totalBlocks: number;
  correctBlocks: number;
};

export type SessionStatus = SessionNotStarted | SessionSubmitted;

export type WorkBookSession = {
  workBook: WorkBookWithoutAnswer;
  session: SessionSubmitted;
};

export type WorkBookReviewSession = {
  workBook: WorkBook;
  isLiked: boolean;
  session: SessionSubmitted;
  commentCount: number;
  submitAnswers: {
    blockId: string;
    isCorrect: boolean;
    submit: BlockAnswerSubmit;
  }[];
};

/**
 * 카테고리 타입
 * parentId를 통한 무한 계층 구조 지원
 */
export type Category = {
  id: number;
  name: string;
  parentId: number | null;
  description: string | null;
  aiPrompt: string | null;
  order: number;
  createdAt: Date;
};

/**
 * 카테고리 트리 구조
 * children을 통한 계층 표현
 */
export type CategoryTree = Category & {
  children: CategoryTree[];
};

export enum WorkBookDifficultyLevel {
  VERY_EASY = "very_easy", // 90점 이상
  EASY = "easy", // 72점 이상
  NORMAL = "normal", // 58점 이상
  HARD = "hard", // 36점 이상
  VERY_HARD = "very_hard", // 36점 미만
}

export type WorkbookComment = {
  id: string;
  parentId: string | null;
  authorNickname: string | null;
  authorPublicId: number | null;
  authorProfile: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date | null;
  likeCount: number;
  isLikedByMe?: boolean;
};

/**
 * 대댓글을 포함한 댓글 타입
 * replies는 최대 1-depth까지만 허용
 */
export type WorkbookCommentWithReplies = WorkbookComment & {
  replies: WorkbookComment[];
};

/**
 * 페이지네이션이 적용된 댓글 응답 타입
 */
export type PaginatedCommentsResponse = {
  comments: WorkbookCommentWithReplies[];
  nextCursor: string | null;
};
