import { Tool, tool } from "ai";
import { z } from "zod";
import { saveWriterToFile } from "./shared";

export const setWriterTool: Tool = tool({
  description: "공지 작성자 이름을 설정합니다.",
  inputSchema: z.object({
    name: z.string().describe("작성자 이름을 입력하세요."),
  }),
  execute: ({ name }) => {
    const writer = name;

    saveWriterToFile(writer);

    return `작성자 정보가 설정되었습니다. 앞으로 ${name}님으로 활동하시게 됩니다!`;
  },
});
