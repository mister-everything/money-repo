import { Tool, tool } from "ai";
import z from "zod";
import { Changelog, ChangelogType } from "../types";
import { getFileByMarkdown, saveFileByMarkdown } from "./shared";

export const saveChangelogTool: Tool = tool({
  description: "정리된 내용을 CHANGELOG.md 파일에 추가합니다.",
  name: "saveChangelog",
  inputSchema: z.object({
    version: z.string().describe("버전을 작성하세요. (ex: 1.0.0)"),
    changelogs: z
      .array(
        z.object({
          type: z.enum(ChangelogType).describe("타입을 작성하세요."),
          contents: z
            .array(
              z.object({
                description: z.string().describe("내용을 작성하세요."),
                commitNumber: z
                  .string()
                  .describe("커밋 번호를 작성하세요.(5자리 숫자)"),
                author: z
                  .string()
                  .describe("작성자를 작성하세요.(커밋 작성자)"),
              }),
            )
            .describe("내용을 작성하세요.(여러 개 작성 가능)"),
        }),
      )
      .describe("변경 사항을 작성하세요."),
  }),
  execute: ({ version, changelogs }) => {
    let changelog = getFileByMarkdown();

    const newChangelog = changelogTemplate(version, changelogs);

    const updatedChangelog = newChangelog + "\n" + changelog;
    saveFileByMarkdown(updatedChangelog);
    return newChangelog;
  },
});

const changelogTemplate = (version: string, changelogs: Changelog[]) => `
## ${version} - ${formatDate(new Date())}
${changelogs
  .map(
    (changelog) => `### ${changelog.type}
 ${changelog.contents.map((content) => `- ${content.description} (${content.commitNumber}) (${content.author})`).join("\n ")}
`,
  )
  .join("\n")}
`;

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
