import { Tool, tool } from "ai";
import { execSync } from "child_process";
import { z } from "zod";

export const gitDiffTool: Tool = tool({
  description:
    "git diff 명령어를 실행합니다. 파일 변경 사항과 경로를 반환합니다.",
  name: "gitDiff",
  inputSchema: z.object({}),
  execute: () => {
    const result = execSync("git diff");
    return result.toString();
  },
});
