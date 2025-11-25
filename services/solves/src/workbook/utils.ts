import { PublicError } from "@workspace/error";
import { generateUUID } from "@workspace/util";
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
    throw new PublicError(`Content is required`);
  }
  if (!All_BLOCKS[content.type]) {
    throw new PublicError(`Invalid content type: ${content.type}`);
  }
  return All_BLOCKS[content.type].contentSchema.parse(content);
};

export const parseAnswer = (answer?: BlockAnswer) => {
  if (!answer?.type) {
    throw new PublicError(`Answer is required`);
  }
  if (!All_BLOCKS[answer.type]) {
    throw new PublicError(`Invalid answer type: ${answer.type}`);
  }
  return All_BLOCKS[answer.type].answerSchema.parse(answer);
};

export const parseAnswerSubmit = (answerSubmit?: BlockAnswerSubmit) => {
  if (!answerSubmit?.type) {
    throw new PublicError(`Answer submit is required`);
  }
  if (!All_BLOCKS[answerSubmit.type]) {
    throw new PublicError(`Invalid answer submit type: ${answerSubmit.type}`);
  }
  return All_BLOCKS[answerSubmit.type].answerSubmitSchema.parse(answerSubmit);
};

export const checkAnswer = (
  correctAnswer: BlockAnswer,
  submittedAnswer: BlockAnswerSubmit,
) => {
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
      throw new PublicError(`찾을 수 없는 블럭 유형: ${blockType}`);
  }
};
