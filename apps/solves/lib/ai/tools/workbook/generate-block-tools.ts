/**
 * AI tool registry
 *
 * LLM이 호출하는 도구이므로 입력 스키마를 최소화하고,
 * DB id 등의 불필요한 값은 포함하지 않는다.
 */

import { WorkBookBlock } from "@service/solves/shared";
import { generateUUID } from "@workspace/util";
import { tool as createTool, Tool } from "ai";

import {
  GEN_BLOCK_TOOL_NAMES,
  GenerateMcqInputSchema,
  GenerateMcqMultipleInputSchema,
  GenerateOxInputSchema,
  GenerateRankingInputSchema,
  GenerateSubjectiveInputSchema,
} from "./types";

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
