import { tool as createTool, Tool } from "ai";
import z from "zod";

export const READ_BLOCK_TOOL_NAME = "readBlock";

export const ReadBlockInputSchema = z.object({
  order: z
    .array(z.number())
    .min(1)
    .max(5, "최대 5개의 문제까지 읽을 수 있습니다.")
    .describe(
      "문제의 order 목록을 입력하세요. 최대 5개까지 입력할 수 있습니다.",
    ),
});

export const readBlockTool: Tool = createTool({
  name: READ_BLOCK_TOOL_NAME,
  inputSchema: ReadBlockInputSchema,
  description: `특정 문제들의 detail 을 읽을 수 있습니다. 많은 문제를 동시에 읽어야 하는 경우 되도록 한번에 모든 문제를 읽기 보단, 1~3개 씩만 조회한 이후에 해당 문제들에 대한 조치를 취하세요.`,
  // execute 는 별도로 없음 client 에서 실행되는 함수
});
