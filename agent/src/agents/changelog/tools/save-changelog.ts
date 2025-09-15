import { Tool, tool } from "ai";
import z from "zod";
import { Changelog, ChangelogType } from "../types";
import { getFileByMarkdown, saveFileByMarkdown } from "./shared";

export const saveChangelogTool: Tool = tool({
  description: "정리된 내용을 CHANGELOG.md 파일에 추가합니다.",
  name: "saveChangelog",
  inputSchema: z.object({
    version: z.string().describe("버전을 작성하세요."),
    changelogs: z
      .array(
        z.object({
          type: z.enum(ChangelogType).describe("타입을 작성하세요."),
          description: z.string().describe("정리된 내용을 작성하세요."),
          prNumber: z.string().describe("PR 번호를 작성하세요."),
          author: z.string().describe("작성자를 작성하세요."),
        }),
      )
      .describe("변경 사항을 작성하세요."),
  }),
  execute: ({ version, changelogs }) => {
    let changelog = getFileByMarkdown();

    const newChangelog = changelogTemplate(version, changelogs);

    const updatedChangelog = newChangelog + "\n" + changelog;
    saveFileByMarkdown(updatedChangelog);
    return "정상적으로 추가 되었습니다. 사용자에게 잘 등록 되었다고 말하세요.";
  },
});

const changelogTemplate = (version: string, changelogs: Changelog[]) => `
## ${version} - ${new Date().toISOString()}
${changelogs
  .map(
    (changelog) => `### ${changelog.type}
- ${changelog.description} (${changelog.prNumber}) (${changelog.author})
`,
  )
  .join("\n")}
`;
