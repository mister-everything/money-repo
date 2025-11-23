import {
  All_BLOCKS,
  BlockAnswer,
  BlockAnswerSubmit,
  type BlockContent,
  type BlockType,
} from "./blocks";

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
  return All_BLOCKS[content.type].contentSchema.parse(content);
};

export const parseAnswer = (answer?: BlockAnswer) => {
  if (!answer?.type) {
    throw new Error(`Answer is required`);
  }
  if (!All_BLOCKS[answer.type]) {
    throw new Error(`Invalid answer type: ${answer.type}`);
  }
  return All_BLOCKS[answer.type].answerSchema.parse(answer);
};

export const parseAnswerSubmit = (answerSubmit?: BlockAnswerSubmit) => {
  if (!answerSubmit?.type) {
    throw new Error(`Answer submit is required`);
  }
  if (!All_BLOCKS[answerSubmit.type]) {
    throw new Error(`Invalid answer submit type: ${answerSubmit.type}`);
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
