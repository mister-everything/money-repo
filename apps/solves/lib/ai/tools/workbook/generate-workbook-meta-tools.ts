import { tool as createTool, Tool } from "ai";
import { WORKBOOK_META_TOOL_NAME, WorkbookMetaInputSchema } from "./shared";

export const generateWorkbookMetaTool: Tool = createTool({
  name: WORKBOOK_META_TOOL_NAME,
  description: "문제집의 제목과 설명을 추천합니다.",
  inputSchema: WorkbookMetaInputSchema,
});
