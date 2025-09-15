import { Tool, tool } from "ai";
import z from "zod";
import { getFileByMarkdown } from "./shared";

export const searchChangelogTool: Tool = tool({
  description: "CHANGELOG.md 파일을 조회합니다.",
  name: "searchChangelog",
  inputSchema: z.object({}),
  execute: () => {
    return getFileByMarkdown();
  },
});
