import { Tool, tool } from "ai";
import { execSync } from "child_process";
import z from "zod";

export const execCommandTool: Tool = tool({
  description: "쉘 명령어를 실행합니다.",
  name: "execCommand",
  inputSchema: z.object({
    command: z.string().describe("쉘 명령어를 작성하세요."),
  }),
  execute: ({ command }) => {
    const result = execSync(command);
    return result.toString();
  },
});
