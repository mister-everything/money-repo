import { tool as createTool, Tool } from "ai";
import z from "zod";

export const ASK_QUESTION_TOOL_NAME = "ask_question";

export const askQuestionInputSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string().describe("질문의 고유 식별자"),
        prompt: z
          .string()
          .min(1)
          .describe("애매한 부분을 명확히 하는 질문 내용"),
        options: z
          .array(
            z.object({
              id: z.string().describe("선택지의 고유 식별자"),
              label: z.string().min(1).describe("선택지 텍스트"),
            }),
          )
          .min(2)
          .max(10)
          .describe("선택지 목록. 선택하면 문제 방향이 정해지는 구체적 옵션"),
        allow_multiple: z
          .boolean()
          .optional()
          .default(false)
          .describe("다중 선택 가능 여부"),
      }),
    )
    .min(1)
    .max(5)
    .describe("사용자 요청에서 불명확한 부분을 파악하기 위한 질문들"),
});

export const askQuestionTool: Tool = createTool({
  name: ASK_QUESTION_TOOL_NAME,
  description:
    "Collect structured multiple-choice answers from the user. Provide one or more questions with options, and set allow_multiple when multi-select is appropriate.",
  inputSchema: askQuestionInputSchema,
});

export const askQuestionOutputSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOptionIds: z.array(z.string()),
    }),
  ),
  additionalMessage: z.string().optional(),
});
export type AskQuestionOutput = z.infer<typeof askQuestionOutputSchema>;
