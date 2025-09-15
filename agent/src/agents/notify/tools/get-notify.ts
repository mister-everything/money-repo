import { Tool, tool } from "ai";
import { z } from "zod";
import { getJsonByFile } from "./shared";

export const getNotifyListTool: Tool = tool({
  description: "Notify 목록을 조회합니다.",
  inputSchema: z.object({}),
  execute: () => getJsonByFile(),
});
