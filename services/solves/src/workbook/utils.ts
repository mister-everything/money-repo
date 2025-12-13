import { generateUUID } from "@workspace/util";
import {
  All_BLOCKS,
  BlockAnswer,
  BlockAnswerSubmit,
  type BlockContent,
  type BlockType,
} from "./blocks";
import { WorkBookBlock, WorkBookDifficultyLevel } from "./types";

type ContentGuardMap = {
  [K in BlockType]: (value: unknown) => value is BlockContent<K>;
};

type AnswerGuardMap = {
  [K in BlockType]: (value: unknown) => value is BlockAnswer<K>;
};

type AnswerSubmitGuardMap = {
  [K in BlockType]: (value: unknown) => value is BlockAnswerSubmit<K>;
};

export const isContent = Object.entries(All_BLOCKS).reduce(
  (acc, [key, block]) => {
    acc[key as BlockType] = block.isMaybeContent;
    return acc;
  },
  {},
) as ContentGuardMap;

export const isAnswer = Object.entries(All_BLOCKS).reduce(
  (acc, [key, block]) => {
    acc[key as BlockType] = block.isMaybeAnswer;
    return acc;
  },
  {},
) as AnswerGuardMap;

export const isAnswerSubmit = Object.entries(All_BLOCKS).reduce(
  (acc, [key, block]) => {
    acc[key as BlockType] = block.isMaybeAnswerSubmit;
    return acc;
  },
  {},
) as AnswerSubmitGuardMap;

export const parseContent = (content?: BlockContent) => {
  if (!content?.type) {
    throw new Error(`Content is required`);
  }
  if (!All_BLOCKS[content.type]) {
    throw new Error(`Invalid content type: ${content.type}`);
  }
  return All_BLOCKS[content.type].contentSchema.safeParse(content);
};

export const parseAnswer = (answer: BlockAnswer) => {
  if (!All_BLOCKS[answer.type]) {
    throw new Error(`Invalid answer type: ${answer.type}`);
  }
  return All_BLOCKS[answer.type].answerSchema.safeParse(answer);
};

export const parseAnswerSubmit = (answerSubmit: BlockAnswerSubmit) => {
  if (!All_BLOCKS[answerSubmit.type]) {
    throw new Error(`Invalid answer submit type: ${answerSubmit.type}`);
  }
  return All_BLOCKS[answerSubmit.type].answerSubmitSchema.safeParse(
    answerSubmit,
  );
};

export const checkAnswer = (
  correctAnswer: BlockAnswer,
  submittedAnswer?: BlockAnswerSubmit,
) => {
  if (!submittedAnswer) {
    return false;
  }
  const correctAnswerType = correctAnswer.type;

  if (correctAnswerType !== submittedAnswer.type) {
    return false;
  }
  if (!All_BLOCKS[correctAnswerType]) {
    return false;
  }
  return All_BLOCKS[correctAnswerType].checkAnswer(
    correctAnswer,
    submittedAnswer,
  );
};

export const blockDisplayNames = Object.entries(All_BLOCKS).reduce(
  (acc, [key, block]) => {
    acc[key as BlockType] = block.displayName;
    return acc;
  },
  {},
) as Record<BlockType, string>;

export const getBlockDisplayName = (blockType: BlockType) => {
  return blockDisplayNames[blockType];
};

export const initializeBlock = (
  blockType: BlockType,
  order?: number,
): WorkBookBlock => {
  switch (blockType) {
    case "default":
      const defaultBlock: WorkBookBlock<"default"> = {
        id: generateUUID(),
        question: "",
        type: blockType,
        answer: {
          type: blockType,
          answer: [],
        },
        content: {
          type: blockType,
        },
        order: order ?? 0,
      };
      return defaultBlock;
    case "mcq":
      const mcqBlock: WorkBookBlock<"mcq"> = {
        id: generateUUID(),
        question: "",
        type: blockType,
        content: {
          type: blockType,
          options: [],
        },
        answer: {
          type: blockType,
          answer: "",
        },
        order: order ?? 0,
      };
      return mcqBlock;
    case "mcq-multiple":
      const mcqMultipleBlock: WorkBookBlock<"mcq-multiple"> = {
        id: generateUUID(),
        question: "",
        type: blockType,
        content: {
          type: blockType,
          options: [],
        },
        answer: {
          type: blockType,
          answer: [],
        },
        order: order ?? 0,
      };
      return mcqMultipleBlock;
    case "ranking":
      const rankingBlock: WorkBookBlock<"ranking"> = {
        id: generateUUID(),
        question: "",
        type: blockType,
        content: {
          type: blockType,
          items: [],
        },
        answer: {
          type: blockType,
          order: [],
        },
        order: order ?? 0,
      };
      return rankingBlock;

    case "ox":
      const oxBlock: WorkBookBlock<"ox"> = {
        id: generateUUID(),
        question: "",
        type: blockType,
        content: {
          type: blockType,
        },
        answer: {
          type: blockType,
          answer: true,
        },
        order: order ?? 0,
      };
      return oxBlock;
    default:
      throw new Error(`찾을 수 없는 블럭 유형: ${blockType}`);
  }
};

export const initialSubmitAnswer = (blockType: BlockType) => {
  switch (blockType) {
    case "default":
      return {
        type: blockType,
        answer: "",
      };
    case "mcq":
      return {
        type: blockType,
        answer: "",
      };
    case "mcq-multiple":
      return {
        type: blockType,
        answer: [],
      };
    case "ranking":
      return {
        type: blockType,
        order: [],
      };
    case "ox":
      return {
        type: blockType,
        answer: undefined,
      };
    default:
      throw new Error(`찾을 수 없는 블럭 유형: ${blockType}`);
  }
};

export const isPublished = (book: {
  publishedAt?: Date | null;
}): book is { publishedAt: Date } => {
  return book.publishedAt !== null;
};

export const getWorkBookDifficulty = (workBook: {
  firstScoreSum?: number;
  firstSolverCount?: number;
}) => {
  const { firstScoreSum = 0, firstSolverCount = 0 } = workBook;

  const avgScore =
    firstSolverCount > 0 ? Math.round(firstScoreSum / firstSolverCount) : 0;

  if (firstSolverCount < 10) {
    return {
      score: 0,
      difficulty: WorkBookDifficultyLevel.VERY_EASY,
      label: "새로운 문제집",
      detail: "10명 이상이 풀면 평균 점수가 표시돼요",
    };
  }

  if (avgScore >= 90) {
    return {
      score: avgScore,
      difficulty: WorkBookDifficultyLevel.VERY_EASY,
      label: "매우 쉬움",
      detail: `평균 점수 ${avgScore}점`,
    };
  }
  if (avgScore >= 72) {
    return {
      score: avgScore,
      difficulty: WorkBookDifficultyLevel.EASY,
      label: "쉬움",
      detail: `평균 점수 ${avgScore}점`,
    };
  }
  if (avgScore >= 58) {
    return {
      score: avgScore,
      difficulty: WorkBookDifficultyLevel.NORMAL,
      label: "보통",
      detail: `평균 점수 ${avgScore}점`,
    };
  }
  if (avgScore >= 36) {
    return {
      score: avgScore,
      difficulty: WorkBookDifficultyLevel.HARD,
      label: "어려움",
      detail: `평균 점수 ${avgScore}점`,
    };
  }
  return {
    score: avgScore,
    difficulty: WorkBookDifficultyLevel.VERY_HARD,
    label: "매우 어려움",
    detail: `평균 점수 ${avgScore}점`,
  };
};
