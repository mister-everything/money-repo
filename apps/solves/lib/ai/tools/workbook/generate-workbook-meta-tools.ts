import { tool as createTool, Tool } from "ai";
import {
  GenerateWorkbookMetaInputSchema,
  WORKBOOK_META_TOOL_NAMES,
} from "./shared";

export const generateWorkbookMetaTool: Tool = createTool({
  name: WORKBOOK_META_TOOL_NAMES.META,
  description:
    "문제집 제목과 한줄 설명을 한 번에 생성합니다. 제목은 20자, 설명은 25자 이하로만 반환하세요.",
  inputSchema: GenerateWorkbookMetaInputSchema,
  execute: async ({ title, description }) => {
    return { title, description };
  },
});

export const loadWorkbookMetaTools = (): Record<string, Tool> => ({
  [WORKBOOK_META_TOOL_NAMES.META]: generateWorkbookMetaTool,
});
