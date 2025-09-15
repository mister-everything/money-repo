import { Tool, tool } from "ai";
import { execSync } from "child_process";
import z from "zod";

export const getCommitLogTool: Tool = tool({
  description:
    "현재 브랜치와 main 브랜치의 차이점을 확인하고 커밋 로그를 반환합니다.",
  name: "getCommitLog",
  inputSchema: z.object({
    branch: z.string().describe("브랜치 이름을 작성하세요."),
  }),
  execute: ({ branch }) => {
    const result = execSync(`git diff main..${branch}`);
    return result.toString();
  },
});
