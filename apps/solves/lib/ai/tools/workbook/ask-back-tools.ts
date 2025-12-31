import { tool as createTool, Tool } from "ai";
import z from "zod";

export const ASK_BACK_TOOL_NAME = "askBack";

export const askBackInputSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(1).describe("애매한 부분을 명확히 하는 질문"),
        options: z
          .array(z.string().min(1))
          .min(2)
          .max(6)
          .describe("3~6개 선택지. 선택하면 문제 방향이 정해지는 구체적 옵션"),
      }),
    )
    .min(2)
    .max(5)
    .describe(
      "3~5개 질문. 사용자 요청에서 불명확한 부분을 파악하기 위한 질문들",
    ),
});

export const askBackTool: Tool = createTool({
  name: ASK_BACK_TOOL_NAME,
  description:
    "사용자 요청이 불명확할 때 핵심 조건(주제/난이도/유형/개수)을 파악하는 역질문 도구. 선택지 기반 질문으로 의도를 구체화하여 고품질 결과물의 방향성을 확보한다.",
  inputSchema: askBackInputSchema,
});
