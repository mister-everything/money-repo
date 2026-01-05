import { tool as createTool, Tool } from "ai";
import { WORKBOOK_META_TOOL_NAME, WorkbookMetaInputSchema } from "./shared";

export const generateWorkbookMetaTool: Tool = createTool({
  name: WORKBOOK_META_TOOL_NAME,
  description:
    "문제집의 제목과 설명 후보를 각각 3~5개씩 추천합니다. 1~2개 제목에는 이모지를 포함해주세요.",
  inputSchema: WorkbookMetaInputSchema,
});
