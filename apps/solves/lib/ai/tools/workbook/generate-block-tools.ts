/**
 * AI tool registry
 *
 * LLM이 호출하는 도구이므로 입력 스키마를 최소화하고,
 * DB id 등의 불필요한 값은 포함하지 않는다.
 */

import { All_BLOCKS, BlockType, WorkBookBlock } from "@service/solves/shared";
import { generateUUID, wait } from "@workspace/util";
import { tool as createTool, Tool } from "ai";

import {
  GEN_BLOCK_TOOL_NAMES,
  GenerateMcqInputSchema,
  GenerateMcqMultipleInputSchema,
  GenerateOxInputSchema,
  GenerateRankingInputSchema,
  GenerateSubjectiveInputSchema,
} from "./shared";

const TOOL_DELAY = 3000; // 고의적으로 지연시간을 줘서 툴 사용 효과를 확인할 수 있도록

/**
 * 객관식(단일) 생성 툴
 * input: 질문, 보기 문자열, 정답 인덱스, 선택적 해설
 * output: 블록 저장/렌더링에 바로 쓸 수 있는 구조
 */
export const generateMcqTool: Tool = createTool({
  name: GEN_BLOCK_TOOL_NAMES.MCQ,
  description: "객관식 문제를 생성합니다.",
  inputSchema: GenerateMcqInputSchema,
  execute: async ({ question, options, correctOptionIndex, solution }) => {
    if (correctOptionIndex < 0 || correctOptionIndex >= options.length) {
      throw new Error("correctOptionIndex 범위를 확인하세요.");
    }

    await wait(TOOL_DELAY);
    const optionObjects = options.map((text) => ({
      id: generateUUID(),
      type: "text" as const,
      text,
    }));

    const answerId = optionObjects[correctOptionIndex].id;

    const block: WorkBookBlock<"mcq"> = {
      id: generateUUID(),
      question,
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
  },
});

/**
 * 객관식(다중) 생성 툴
 * input: 질문, 보기 문자열, 정답 인덱스 배열, 선택적 해설
 * output: 블록 저장/렌더링에 바로 쓸 수 있는 구조
 */
export const generateMcqMultipleTool: Tool = createTool({
  name: GEN_BLOCK_TOOL_NAMES.MCQ_MULTIPLE,
  description: "객관식 문제를 생성합니다.",
  inputSchema: GenerateMcqMultipleInputSchema,
  execute: async ({ question, options, correctOptionIndexes, solution }) => {
    const optionObjects = options.map((text) => ({
      id: generateUUID(),
      type: "text" as const,
      text,
    }));
    const answerIds = optionObjects
      .filter((_, index) => correctOptionIndexes.includes(index))
      .map((option) => option.id);
    await wait(TOOL_DELAY);
    const block: WorkBookBlock<"mcq-multiple"> = {
      id: generateUUID(),
      question,
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
  },
});

/**
 * 주관식 생성 툴
 * input: 질문, 정답 후보 문자열 배열, 선택적 해설
 * output: 블록 저장/렌더링에 바로 쓸 수 있는 구조
 */
export const generateSubjectiveTool: Tool = createTool({
  name: GEN_BLOCK_TOOL_NAMES.SUBJECTIVE,
  description: "주관식 문제를 생성합니다.",
  inputSchema: GenerateSubjectiveInputSchema,
  execute: async ({ question, answers, solution }) => {
    const uniqueAnswers = Array.from(
      new Set(answers.map((a) => a.trim())),
    ).filter((a) => a.length > 0);

    await wait(TOOL_DELAY);
    const block: WorkBookBlock<"default"> = {
      id: generateUUID(),
      question,
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
  },
});

/**
 * 랭킹 생성 툴
 * input: 질문, 순위 항목 문자열 배열, 선택적 해설
 * output: 블록 저장/렌더링에 바로 쓸 수 있는 구조
 */
export const generateRankingTool: Tool = createTool({
  name: GEN_BLOCK_TOOL_NAMES.RANKING,
  description: "순위 문제를 생성합니다.",
  inputSchema: GenerateRankingInputSchema,
  execute: async ({ question, items, correctOrderIndexes, solution }) => {
    const itemObjects = items.map((text) => ({
      id: generateUUID(),
      type: "text" as const,
      text,
    }));
    const answerIds = itemObjects
      .filter((_, index) => correctOrderIndexes.includes(index))
      .map((item) => item.id);
    await wait(TOOL_DELAY);
    const block: WorkBookBlock<"ranking"> = {
      id: generateUUID(),
      question,
      type: "ranking",
      content: {
        type: "ranking",
        items: itemObjects,
      },
      answer: {
        type: "ranking",
        order: answerIds,
        solution,
      },
      order: 0,
    };
    return block;
  },
});

/**
 * OX 생성 툴
 * input: 질문, 정답 문자열, 선택적 해설
 * output: 블록 저장/렌더링에 바로 쓸 수 있는 구조
 */
export const generateOxTool: Tool = createTool({
  name: GEN_BLOCK_TOOL_NAMES.OX,
  description: "OX 문제를 생성합니다.",
  inputSchema: GenerateOxInputSchema,
  execute: async ({ question, answer, solution }) => {
    await wait(TOOL_DELAY);
    const block: WorkBookBlock<"ox"> = {
      id: generateUUID(),
      question,
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
  },
});

export const loadGenerateBlockTools = (blockTypes?: BlockType[]) => {
  const allowedBlockTypes = blockTypes?.length
    ? blockTypes.filter((type) => Boolean(All_BLOCKS[type]))
    : Object.keys(All_BLOCKS);

  return allowedBlockTypes.reduce(
    (prev, type) => {
      switch (type as BlockType) {
        case "mcq":
          prev[GEN_BLOCK_TOOL_NAMES.MCQ] = generateMcqTool;
          break;
        case "mcq-multiple":
          prev[GEN_BLOCK_TOOL_NAMES.MCQ_MULTIPLE] = generateMcqMultipleTool;
          break;
        case "ranking":
          prev[GEN_BLOCK_TOOL_NAMES.RANKING] = generateRankingTool;
          break;
        case "ox":
          prev[GEN_BLOCK_TOOL_NAMES.OX] = generateOxTool;
          break;
        case "default":
          prev[GEN_BLOCK_TOOL_NAMES.SUBJECTIVE] = generateSubjectiveTool;
          break;
      }

      return prev;
    },
    {} as Record<string, Tool>,
  );
};
