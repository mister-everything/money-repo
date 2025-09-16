import { Tool, tool } from "ai";
import { z } from "zod";
import { storage } from "./shared";

export const getTodoListTool: Tool = tool({
  description: "TODO 목록을 조회합니다.",
  inputSchema: z.object({}),
  execute: async () => (await storage.get()) ?? [],
});
