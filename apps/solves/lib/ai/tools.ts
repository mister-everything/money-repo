/**
 * AI tool registry
 *
 * LLM이 호출하는 도구이므로 입력 스키마를 최소화하고,
 * DB id 등의 불필요한 값은 포함하지 않는다.
 */

import {
  BLOCK_OPTION_TEXT_MAX_LENGTH,
  DEFAULT_BLOCK_ANSWER_MAX_LENGTH,
  DEFAULT_BLOCK_MAX_ANSWERS,
  MCQ_BLOCK_MAX_OPTIONS,
  MCQ_BLOCK_MIN_OPTIONS,
} from "@service/solves/shared";
import { generateUUID } from "@workspace/util";
import { tool } from "ai";
import z from "zod";

/**
 * 객관식(단일) 생성 툴
 * input: 질문, 보기 문자열, 정답 인덱스, 선택적 해설
 * output: 블록 저장/렌더링에 바로 쓸 수 있는 구조
 */
export const generateMcqTool = tool({
  description: "객관식(단일) 문제 블록 생성",
  inputSchema: z.object({
    question: z.string().min(1, "문제를 입력하세요."),
    options: z
      .array(
        z
          .string()
          .min(1, "보기는 비어 있을 수 없습니다.")
          .max(
            BLOCK_OPTION_TEXT_MAX_LENGTH,
            `보기는 최대 ${BLOCK_OPTION_TEXT_MAX_LENGTH}자입니다.`,
          ),
      )
      .min(MCQ_BLOCK_MIN_OPTIONS, `보기는 최소 ${MCQ_BLOCK_MIN_OPTIONS}개`)
      .max(MCQ_BLOCK_MAX_OPTIONS, `보기는 최대 ${MCQ_BLOCK_MAX_OPTIONS}개`),
    correctOptionIndex: z
      .number()
      .int()
      .nonnegative()
      .describe("0 기반 인덱스"),
    solution: z
      .string()
      .min(1, "정답/해설을 입력하세요.")
      .max(300, "해설은 300자 이내"),
  }),
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

    return {
      type: "mcq" as const,
      question,
      content: {
        type: "mcq" as const,
        options: optionObjects,
      },
      answer: {
        type: "mcq" as const,
        answer: answerId,
        solution,
      },
    };
  },
});

/**
 * 주관식 생성 툴
 * input: 질문, 정답 후보 문자열 배열, 선택적 해설
 * output: 블록 저장/렌더링에 바로 쓸 수 있는 구조
 */
export const generateSubjectiveTool = tool({
  description: "주관식 문제 블록 생성",
  inputSchema: z.object({
    question: z.string().min(1, "문제를 입력하세요."),
    answers: z
      .array(
        z
          .string()
          .min(1, "정답은 비어 있을 수 없습니다.")
          .max(
            DEFAULT_BLOCK_ANSWER_MAX_LENGTH,
            `정답은 최대 ${DEFAULT_BLOCK_ANSWER_MAX_LENGTH}자입니다.`,
          ),
      )
      .min(1, "정답은 최소 1개 이상")
      .max(
        DEFAULT_BLOCK_MAX_ANSWERS,
        `정답은 최대 ${DEFAULT_BLOCK_MAX_ANSWERS}개`,
      ),
    solution: z
      .string()
      .min(1, "정답/해설을 입력하세요.")
      .max(300, "해설은 300자 이내"),
  }),
  execute: async ({ question, answers, solution }) => {
    const uniqueAnswers = Array.from(
      new Set(answers.map((a) => a.trim())),
    ).filter((a) => a.length > 0);

    return {
      type: "default" as const,
      question,
      content: {
        type: "default" as const,
      },
      answer: {
        type: "default" as const,
        answer: uniqueAnswers,
        solution,
      },
    };
  },
});
