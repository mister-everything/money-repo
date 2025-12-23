import { tool as createTool, Tool } from "ai";
import z from "zod";

export const PROMPT_DIRECTOR_TOOL_NAME = "promptDirector";

export const promptDirectorInputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
    }),
  ),
});

export const promptDirectorTool: Tool = createTool({
  name: PROMPT_DIRECTOR_TOOL_NAME,
  description: `사용자가 주어없이 목적없이 질문을 했을 때 너가 문제를 잘 만들 수 있게 방향성을 제시 해준다.`,
  inputSchema: promptDirectorInputSchema,
});
