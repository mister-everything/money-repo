import {
  type CreateReportInput,
  ReportCategoryDetail,
  ReportCategoryMain,
} from "@service/report/shared";
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

export type WorkBookSession = {
  workBook: WorkBookWithoutAnswer;
  session: SessionInProgress | SessionSubmitted;
};

export type WorkBookReviewSession = {
  workBook: WorkBook;
  isLiked: boolean;
  session: SessionSubmitted;
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

export type ReportDraft = Omit<CreateReportInput, "reporterUserId">;

export const REPORT_REASON_SECTIONS = [
  {
    main: ReportCategoryMain.ERROR,
    heading: "오류 (Error)",
    reasons: [
      { detail: ReportCategoryDetail.ERROR_ANSWER, label: "정답이 틀렸어요" },
      {
        detail: ReportCategoryDetail.ERROR_TYPO,
        label: "문제 또는 보기에 오탈자가 있어요",
      },
      {
        detail: ReportCategoryDetail.ERROR_EXPLANATION,
        label: "해설이 부정확하거나 부적절해요",
      },
    ],
  },
  {
    main: ReportCategoryMain.VIOLATION,
    heading: "위반 (Violation)",
    reasons: [
      {
        detail: ReportCategoryDetail.VIOL_GUIDELINE,
        label: "가이드라인을 위반했어요",
      },
      {
        detail: ReportCategoryDetail.VIOL_SPAM,
        label: "도배 및 스팸 내용이 있어요",
      },
      {
        detail: ReportCategoryDetail.VIOL_TITLE,
        label: "연령과 주제를 위반했어요",
      },
      {
        detail: ReportCategoryDetail.VIOL_COPYRIGHT,
        label: "저작권을 침해했어요",
      },
      {
        detail: ReportCategoryDetail.VIOL_PERSONAL_DATA,
        label: "개인정보를 유출했어요",
      },
    ],
  },
  {
    main: ReportCategoryMain.OTHER,
    heading: "기타 (Other)",
    reasons: [
      {
        detail: ReportCategoryDetail.OTHER_SYSTEM,
        label: "기타 시스템 오류를 발견했어요",
      },
      { detail: ReportCategoryDetail.OTHER_FREE, label: "자율 작성" },
    ],
  },
] as const;
