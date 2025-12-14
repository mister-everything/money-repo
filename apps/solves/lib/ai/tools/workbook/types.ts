import {
  BLOCK_OPTION_TEXT_MAX_LENGTH,
  DEFAULT_BLOCK_ANSWER_MAX_LENGTH,
  DEFAULT_BLOCK_MAX_ANSWERS,
  MCQ_BLOCK_MAX_OPTIONS,
  MCQ_BLOCK_MIN_OPTIONS,
} from "@service/solves/shared";
import z from "zod";

/**
 * Tools input,output Type 을 client 에서도 사용 할 수 있도록
 * 별도 파일로 분리
 */

export const GEN_MCQ_TOOL_NAME = "generateMcqTool";

export const GenerateMcqInputSchema = z.object({
  question: z
    .string()
    .min(
      1,
      "문제의 질문을 입력하세요. 필요한 경우 Markdown 형식으로 입력해도 됩니다.",
    ),
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
export type GenerateMcqInput = z.infer<typeof GenerateMcqInputSchema>;

export const GEN_SUBJECTIVE_TOOL_NAME = "generateSubjectiveTool";

export const GenerateSubjectiveInputSchema = z.object({
  question: z.string().min(1).describe("문제의 질문을 입력하세요."),
  answers: z
    .array(z.string().min(1).max(DEFAULT_BLOCK_ANSWER_MAX_LENGTH))
    .min(1)
    .max(DEFAULT_BLOCK_MAX_ANSWERS)
    .describe("정답을 입력하세요."),
  solution: z.string().min(1).max(300).describe("문제의 해설을 입력하세요."),
});
export type GenerateSubjectiveInput = z.infer<
  typeof GenerateSubjectiveInputSchema
>;
