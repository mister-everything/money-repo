import { Tool, tool } from "ai";
import { execSync } from "child_process";
import { z } from "zod";

export const addCommitTool: Tool = tool({
  description: "커밋 메시지를 추가합니다.",
  inputSchema: z.object({
    files: z
      .array(z.string())
      .describe("커밋할 파일 이름과 경로를 작성하세요.(ex: src/index.ts)"),
    commitMessage: z.string().describe("커밋 메시지를 작성하세요."),
  }),
  execute: ({ files, commitMessage }) => {
    // 에러 발생 시 예외 처리
    try {
      execSync(`git add ${files.join(" ")}`);
      execSync(`git commit -m "${commitMessage}"`);
      return "정상적으로 커밋 되었습니다. 사용자에게 잘 등록 되었다고 말하세요.";
    } catch (error) {
      return `커밋 실패했습니다. 커밋 메시지를 다시 작성하세요. ${error}`;
    }
  },
});
