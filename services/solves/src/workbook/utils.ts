import { generateUUID } from "@workspace/util";
import z, { ZodError } from "zod";
import { logger } from "../logger";
import {
  All_BLOCKS,
  BlockAnswer,
  BlockAnswerSubmit,
  type BlockContent,
  type BlockType,
} from "./blocks";
import { WorkBookBlock } from "./types";

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

export const validateBlock = (
  block: WorkBookBlock,
):
  | { success: true }
  | {
      success: false;
      message: string;
      errors?: Record<string, string[]>;
    } => {
  try {
    if (block.type !== block.content?.type)
      return {
        success: false,
        message: `블럭 타입과 콘텐츠 타입이 일치하지 않습니다.`,
      };
    if (block.type !== block.answer?.type)
      return {
        success: false,
        message: `블럭 타입과 정답 타입이 일치하지 않습니다.`,
      };

    let result: ReturnType<typeof validateBlock> = {
      success: true,
    };

    const questionResult = z
      .object({
        question: z
          .string("질문은 필수 입력값입니다.")
          .min(1, "질문은 최소 1자 이상 입력해주세요.")
          .max(500, "최대 500자 이하로 입력해주세요."),
      })
      .safeParse({
        question: block.question,
      });

    if (!questionResult.success) {
      return {
        success: false,
        message: `질문 검증에 실패했습니다.`,
        errors:
          z.flattenError(questionResult.error as ZodError).fieldErrors || {},
      };
    }
    const contentResult = parseContent(block.content);
    if (!contentResult.success) {
      return {
        success: false,
        message: `콘텐츠 검증에 실패했습니다.`,
        errors:
          z.flattenError(contentResult.error as ZodError).fieldErrors || {},
      };
    }
    const answerResult = parseAnswer(block.answer);
    if (!answerResult.success) {
      return {
        success: false,
        message: `정답 검증에 실패했습니다.`,
        errors:
          z.flattenError(answerResult.error as ZodError).fieldErrors || {},
      };
    }
    return result;
  } catch (error) {
    logger.error(error);
    return {
      success: false,
      message: `블럭 검증에 실패했습니다.`,
    };
  }
};

export const checkAnswer = (
  correctAnswer: BlockAnswer,
  submittedAnswer: BlockAnswerSubmit,
) => {
  const correctAnswerType = correctAnswer.type;
  console.log({
    correctAnswer,
    submittedAnswer,
  });

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
        answer: true,
      };
    default:
      throw new Error(`찾을 수 없는 블럭 유형: ${blockType}`);
  }
};
