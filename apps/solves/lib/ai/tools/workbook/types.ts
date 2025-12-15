import {
  BLOCK_OPTION_TEXT_MAX_LENGTH,
  DEFAULT_BLOCK_ANSWER_MAX_LENGTH,
  DEFAULT_BLOCK_MAX_ANSWERS,
  MCQ_BLOCK_MAX_OPTIONS,
  MCQ_BLOCK_MIN_OPTIONS,
  RANKING_BLOCK_ITEM_MAX_LENGTH,
  RANKING_BLOCK_MAX_ITEMS,
  RANKING_BLOCK_MIN_ITEMS,
} from "@service/solves/shared";
import z from "zod";

/**
 * Tools input,output Type 을 client 에서도 사용 할 수 있도록
 * 별도 파일로 분리
 */

export const GEN_MCQ_TOOL_NAME = "generateMcqTool";
export const GEN_MCQ_MULTIPLE_TOOL_NAME = "generateMcqMultipleTool";
export const GEN_SUBJECTIVE_TOOL_NAME = "generateSubjectiveTool";
export const GEN_RANKING_TOOL_NAME = "generateRankingTool";
export const GEN_OX_TOOL_NAME = "generateOxTool";

// 객관식(단일)
export const GenerateMcqInputSchema = z.object({
  question: z.string().min(1, "문제의 질문을 입력하세요."),
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
  solution: z.string().min(1).max(300).describe("문제의 해설을 입력하세요."),
});

// 객관식(다중)
export const GenerateMcqMultipleInputSchema = z.object({
  question: z.string().min(1, "문제의 질문을 입력하세요."),
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
  solution: z.string().min(1).max(300).describe("문제의 해설을 입력하세요."),
});

// 주관식
export const GenerateSubjectiveInputSchema = z.object({
  question: z.string().min(1).describe("문제의 질문을 입력하세요."),
  answers: z
    .array(z.string().min(1).max(DEFAULT_BLOCK_ANSWER_MAX_LENGTH))
    .min(1)
    .max(DEFAULT_BLOCK_MAX_ANSWERS)
    .describe("정답을 입력하세요."),
  solution: z.string().min(1).max(300).describe("문제의 해설을 입력하세요."),
});

// 순위
export const GenerateRankingInputSchema = z.object({
  question: z.string().min(1).describe("문제의 질문을 입력하세요."),
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
  solution: z.string().min(1).max(300).describe("문제의 해설을 입력하세요."),
});

// OX
export const GenerateOxInputSchema = z.object({
  question: z.string().min(1).describe("문제의 질문을 입력하세요."),
  answer: z
    .boolean()
    .describe("정답이 참이면 true, 거짓이면 false로 입력하세요."),
  solution: z.string().min(1).max(300).describe("문제의 해설을 입력하세요."),
});

export type GenerateMcqInput = z.infer<typeof GenerateMcqInputSchema>;
export type GenerateMcqMultipleInput = z.infer<
  typeof GenerateMcqMultipleInputSchema
>;
export type GenerateSubjectiveInput = z.infer<
  typeof GenerateSubjectiveInputSchema
>;
export type GenerateRankingInput = z.infer<typeof GenerateRankingInputSchema>;
export type GenerateOxInput = z.infer<typeof GenerateOxInputSchema>;
