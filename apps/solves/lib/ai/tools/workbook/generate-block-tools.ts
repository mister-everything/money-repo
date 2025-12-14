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
  GEN_MCQ_TOOL_NAME,
  GEN_SUBJECTIVE_TOOL_NAME,
  GenerateMcqInputSchema,
  GenerateSubjectiveInputSchema,
} from "./types";

/**
 * 객관식(단일) 생성 툴
 * input: 질문, 보기 문자열, 정답 인덱스, 선택적 해설
 * output: 블록 저장/렌더링에 바로 쓸 수 있는 구조
 */
export const generateMcqTool: Tool = createTool({
  name: GEN_MCQ_TOOL_NAME,
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
 * 주관식 생성 툴
 * input: 질문, 정답 후보 문자열 배열, 선택적 해설
 * output: 블록 저장/렌더링에 바로 쓸 수 있는 구조
 */
export const generateSubjectiveTool: Tool = createTool({
  name: GEN_SUBJECTIVE_TOOL_NAME,
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
