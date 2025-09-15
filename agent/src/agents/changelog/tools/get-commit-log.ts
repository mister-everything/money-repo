import { Tool, tool } from "ai";
import { execSync } from "child_process";
import z from "zod";

export const getCommitLogTool: Tool = tool({
  description:
    "현재 브랜치와 main 브랜치의 차이점을 확인하고 커밋 로그를 반환합니다. 브랜치 정보가 없는 경우 input 값에 빈 문자열을 작성하세요.",
  name: "getCommitLog",
  inputSchema: z.object({
    branch: z.string().optional().describe("브랜치 이름을 작성하세요."),
  }),
  execute: ({ branch }) => {
    let currentBranch = branch;
    if (currentBranch === "" || currentBranch === undefined) {
      currentBranch = execSync(`git branch --show-current`).toString();
    }
    const result = execSync(`git log -p main..${currentBranch}`);
    return result.toString();
  },
});
