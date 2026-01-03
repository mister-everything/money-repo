import {
  BLOCK_OPTION_TEXT_MAX_LENGTH,
  BlockType,
  DEFAULT_BLOCK_ANSWER_MAX_LENGTH,
  DEFAULT_BLOCK_MAX_ANSWERS,
  MCQ_BLOCK_MAX_OPTIONS,
  MCQ_BLOCK_MIN_OPTIONS,
  RANKING_BLOCK_ITEM_MAX_LENGTH,
  RANKING_BLOCK_MAX_ITEMS,
  RANKING_BLOCK_MIN_ITEMS,
  WORKBOOK_DESCRIPTION_MAX_LENGTH,
  WORKBOOK_TITLE_MAX_LENGTH,
  WorkBookBlock,
} from "@service/solves/shared";
import { createIdGenerator, normalizeNewLine, shuffle } from "@workspace/util";
import z from "zod";

/**
 * Tools input,output Type 을 client 에서도 사용 할 수 있도록
 * 별도 파일로 분리
 */

export enum GEN_BLOCK_TOOL_NAMES {
  MCQ = "generateMcq",
  MCQ_MULTIPLE = "generateMcqMultiple",
  SUBJECTIVE = "generateSubjective",
  RANKING = "generateRanking",
  OX = "generateOX",
}

export enum EDIT_BLOCK_TOOL_NAMES {
  MCQ = "editMcq",
  MCQ_MULTIPLE = "editMcqMultiple",
  DEFAULT = "editDefault",
  RANKING = "editRanking",
  OX = "editOx",
}

export enum EDIT_FIELD_TOOL_NAMES {
  QUESTION = "editQuestion",
  CONTENT = "editContent",
  ANSWER = "editAnswer",
  SOLUTION = "editSolution",
}

export const WORKBOOK_META_TOOL_NAME = "updateWorkbookMeta";

// 공통 입력 스키마
const BASE = z.object({
  question: z.string().min(1, "문제의 질문을 입력하세요."),
  solution: z.string().min(1).max(300).describe("문제의 해설을 입력하세요."),
});

// 객관식(단일)
export const GenerateMcqInputSchema = BASE.extend({
  options: z
    .array(z.string().min(1).max(BLOCK_OPTION_TEXT_MAX_LENGTH))
    .min(MCQ_BLOCK_MIN_OPTIONS)
    .max(MCQ_BLOCK_MAX_OPTIONS)
    .describe("보기를 입력하세요."),
  correctOptionIndex: z
    .number()
    .int()
    .nonnegative()
    .describe("options 배열에서 정답 인덱스를 입력하세요."),
});

export const mcqToolInputToBlock = ({
  id,
  input,
}: {
  id: string;
  input: z.infer<typeof GenerateMcqInputSchema>;
}): WorkBookBlock<"mcq"> => {
  const { question, options, correctOptionIndex, solution } = input;
  const gen = createIdGenerator();

  const optionObjects = options.map((text) => ({
    id: gen(),
    type: "text" as const,
    text,
  }));

  const answerId = optionObjects[correctOptionIndex].id;

  const block: WorkBookBlock<"mcq"> = {
    id,
    question: normalizeNewLine(question),
    content: {
      type: "mcq",
      options: optionObjects,
    },
    answer: {
      type: "mcq",
      answer: answerId,
      solution,
    },
    type: "mcq",
    order: 0,
  };

  return block;
};

// 객관식(다중)
export const GenerateMcqMultipleInputSchema = BASE.extend({
  options: z
    .array(z.string().min(1).max(BLOCK_OPTION_TEXT_MAX_LENGTH))
    .min(MCQ_BLOCK_MIN_OPTIONS)
    .max(MCQ_BLOCK_MAX_OPTIONS)
    .describe("보기를 입력하세요."),
  correctOptionIndexes: z
    .array(z.number().int().nonnegative())
    .min(1)
    .max(MCQ_BLOCK_MAX_OPTIONS)
    .describe("정답인 보기의 인덱스 배열을 입력하세요."),
});

export const mcqMultipleToolInputToBlock = ({
  id,
  input,
}: {
  id: string;
  input: z.infer<typeof GenerateMcqMultipleInputSchema>;
}): WorkBookBlock<"mcq-multiple"> => {
  const { question, options, correctOptionIndexes, solution } = input;
  const gen = createIdGenerator();

  const optionObjects = options.map((text) => ({
    id: gen(),
    type: "text" as const,
    text,
  }));

  const answerIds = optionObjects
    .filter((_, index) => correctOptionIndexes.includes(index))
    .map((option) => option.id);

  const block: WorkBookBlock<"mcq-multiple"> = {
    id,
    question: normalizeNewLine(question),
    type: "mcq-multiple",
    content: {
      type: "mcq-multiple",
      options: optionObjects,
    },
    answer: {
      type: "mcq-multiple",
      answer: answerIds,
      solution,
    },
    order: 0,
  };

  return block;
};

// 주관식
export const GenerateSubjectiveInputSchema = BASE.extend({
  answers: z
    .array(z.string().min(1).max(DEFAULT_BLOCK_ANSWER_MAX_LENGTH))
    .min(1)
    .max(DEFAULT_BLOCK_MAX_ANSWERS)
    .describe("정답 단어를 입력하세요."),
});

export const subjectiveToolInputToBlock = ({
  id,
  input,
}: {
  id: string;
  input: z.infer<typeof GenerateSubjectiveInputSchema>;
}): WorkBookBlock<"default"> => {
  const { question, answers, solution } = input;

  const uniqueAnswers = Array.from(
    new Set(answers.map((a) => a.trim())),
  ).filter((a) => a.length > 0);

  const block: WorkBookBlock<"default"> = {
    id,
    question: normalizeNewLine(question),
    type: "default",
    content: {
      type: "default",
    },
    answer: {
      type: "default",
      answer: uniqueAnswers,
      solution,
    },
    order: 0,
  };

  return block;
};

// 순위
export const GenerateRankingInputSchema = BASE.extend({
  items: z
    .array(z.string().min(1).max(RANKING_BLOCK_ITEM_MAX_LENGTH))
    .min(RANKING_BLOCK_MIN_ITEMS)
    .max(RANKING_BLOCK_MAX_ITEMS)
    .describe("순위를 매길 항목을 입력하세요."),
  correctOrderIndexes: z
    .array(z.number().int().nonnegative())
    .min(RANKING_BLOCK_MIN_ITEMS)
    .max(RANKING_BLOCK_MAX_ITEMS)
    .describe("items 배열의 올바른 순서 인덱스 배열을 입력하세요."),
});

export const rankingToolInputToBlock = ({
  id,
  input,
}: {
  id: string;
  input: z.infer<typeof GenerateRankingInputSchema>;
}): WorkBookBlock<"ranking"> => {
  const { question, items, correctOrderIndexes, solution } = input;
  const gen = createIdGenerator();

  const itemObjects = items.map((text) => ({
    id: gen(),
    type: "text" as const,
    text,
  }));

  const answerIds = correctOrderIndexes.map((index) => itemObjects[index].id);

  const block: WorkBookBlock<"ranking"> = {
    id,
    question: normalizeNewLine(question),
    type: "ranking",
    content: {
      type: "ranking",
      items: shuffle(itemObjects),
    },
    answer: {
      type: "ranking",
      order: answerIds,
      solution,
    },
    order: 0,
  };

  return block;
};

// OX
export const GenerateOxInputSchema = BASE.extend({
  answer: z
    .boolean()
    .describe("정답이 참이면 true, 거짓이면 false로 입력하세요."),
});

export const oxToolInputToBlock = ({
  id,
  input,
}: {
  id: string;
  input: z.infer<typeof GenerateOxInputSchema>;
}): WorkBookBlock<"ox"> => {
  const { question, answer, solution } = input;

  const block: WorkBookBlock<"ox"> = {
    id,
    question: normalizeNewLine(question),
    type: "ox",
    content: {
      type: "ox",
    },
    answer: {
      type: "ox",
      answer,
      solution,
    },
    order: 0,
  };

  return block;
};

export const EditMcqInputSchema = BASE.extend({
  options: z
    .array(z.string().min(1).max(BLOCK_OPTION_TEXT_MAX_LENGTH))
    .min(MCQ_BLOCK_MIN_OPTIONS)
    .max(MCQ_BLOCK_MAX_OPTIONS)
    .describe("보기를 입력하세요."),
  correctOptionIndex: z
    .number()
    .int()
    .nonnegative()
    .describe("options 배열에서 정답 인덱스를 입력하세요."),
});

export const EditMcqMultipleInputSchema = BASE.extend({
  options: z
    .array(z.string().min(1).max(BLOCK_OPTION_TEXT_MAX_LENGTH))
    .min(MCQ_BLOCK_MIN_OPTIONS)
    .max(MCQ_BLOCK_MAX_OPTIONS)
    .describe("보기를 입력하세요."),
  correctOptionIndexes: z
    .array(z.number().int().nonnegative())
    .min(1)
    .max(MCQ_BLOCK_MAX_OPTIONS)
    .describe("정답인 보기의 인덱스 배열을 입력하세요."),
});

export const EditDefaultInputSchema = BASE.extend({
  answers: z
    .array(z.string().min(1).max(DEFAULT_BLOCK_ANSWER_MAX_LENGTH))
    .min(1)
    .max(DEFAULT_BLOCK_MAX_ANSWERS)
    .describe("정답 단어를 입력하세요."),
});

export const EditRankingInputSchema = BASE.extend({
  items: z
    .array(z.string().min(1).max(RANKING_BLOCK_ITEM_MAX_LENGTH))
    .min(RANKING_BLOCK_MIN_ITEMS)
    .max(RANKING_BLOCK_MAX_ITEMS)
    .describe("순위를 매길 항목을 입력하세요."),
});

export const EditOxInputSchema = BASE.extend({
  answer: z
    .boolean()
    .describe("정답이 참이면 true, 거짓이면 false로 입력하세요."),
});

export const EditQuestionInputSchema = z.object({
  question: z.string(),
});

export const SolutionInputSchema = z.object({
  solution: z.string(),
});
export const ContentSchemas: Record<BlockType, z.ZodObject<any>> = {
  mcq: z.object({
    options: z
      .array(z.string().min(1).max(BLOCK_OPTION_TEXT_MAX_LENGTH))
      .min(MCQ_BLOCK_MIN_OPTIONS)
      .max(MCQ_BLOCK_MAX_OPTIONS)
      .describe("수정된 보기 목록"),
  }),
  "mcq-multiple": z.object({
    options: z
      .array(z.string().min(1).max(BLOCK_OPTION_TEXT_MAX_LENGTH))
      .min(MCQ_BLOCK_MIN_OPTIONS)
      .max(MCQ_BLOCK_MAX_OPTIONS)
      .describe("수정된 보기 목록"),
  }),
  ranking: z.object({
    items: z
      .array(z.string().min(1).max(BLOCK_OPTION_TEXT_MAX_LENGTH))
      .min(RANKING_BLOCK_MIN_ITEMS)
      .max(RANKING_BLOCK_MAX_ITEMS)
      .describe("수정된 순위 항목 목록"),
  }),
  default: z.object({}), // 주관식은 content 없음
  ox: z.object({}), // OX도 content 없음
};

export const AnswerSchemas: Record<BlockType, z.ZodObject<any>> = {
  mcq: z.object({
    correctOptionIndex: z
      .number()
      .int()
      .nonnegative()
      .describe("정답 인덱스 (0부터 시작)"),
  }),
  "mcq-multiple": z.object({
    correctOptionIndexes: z
      .array(z.number().int().nonnegative())
      .min(1)
      .describe("정답 인덱스 배열"),
  }),
  ranking: z.object({
    correctOrderIndexes: z
      .array(z.number().int().nonnegative())
      .min(RANKING_BLOCK_MIN_ITEMS)
      .describe("올바른 순서의 인덱스 배열"),
  }),
  default: z.object({
    answers: z
      .array(z.string().min(1).max(DEFAULT_BLOCK_ANSWER_MAX_LENGTH))
      .min(1)
      .max(DEFAULT_BLOCK_MAX_ANSWERS)
      .describe("정답 후보 목록"),
  }),
  ox: z.object({
    answer: z.boolean().describe("정답 (true: O, false: X)"),
  }),
};

export type EditQuestionInput = z.infer<typeof EditQuestionInputSchema>;
export type SolutionInput = z.infer<typeof SolutionInputSchema>;

export type EditMcqInput = z.infer<typeof EditMcqInputSchema>;
export type EditMcqMultipleInput = z.infer<typeof EditMcqMultipleInputSchema>;
export type EditDefaultInput = z.infer<typeof EditDefaultInputSchema>;
export type EditRankingInput = z.infer<typeof EditRankingInputSchema>;
export type EditOxInput = z.infer<typeof EditOxInputSchema>;

export type GenerateMcqInput = z.infer<typeof GenerateMcqInputSchema>;
export type GenerateMcqMultipleInput = z.infer<
  typeof GenerateMcqMultipleInputSchema
>;
export type GenerateSubjectiveInput = z.infer<
  typeof GenerateSubjectiveInputSchema
>;
export type GenerateRankingInput = z.infer<typeof GenerateRankingInputSchema>;
export type GenerateOxInput = z.infer<typeof GenerateOxInputSchema>;

// Workbook 메타 (제목/설명) 생성
export const WorkbookMetaInputSchema = z.object({
  titles: z
    .array(z.string().min(1, "문제집 제목은 최소 1자 이상 입력하세요."))
    .min(1)
    .max(5)
    .describe(
      `문제집의 제목 후보 3~5개를 입력하세요. 각 제목은 최대 ${WORKBOOK_TITLE_MAX_LENGTH}자 입니다.`,
    ),
  descriptions: z
    .array(z.string().min(1, "한줄 설명은 최소 1자이상 입력하세요."))
    .min(1)
    .max(5)
    .describe(
      `문제집의 설명 후보 3~5개를 입력하세요. 각 설명은 ${WORKBOOK_DESCRIPTION_MAX_LENGTH - 5}~${WORKBOOK_DESCRIPTION_MAX_LENGTH}자 로 제한해주세요.`,
    ),
});

export type WorkbookMetaInput = z.infer<typeof WorkbookMetaInputSchema>;
