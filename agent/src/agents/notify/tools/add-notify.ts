import { Tool, tool } from "ai";
import { z } from "zod";
import { Notify } from "../types";
import { getJsonByFile, getWriterFromFile, saveJsonByFile } from "./shared";

export const addNotifyTool: Tool = tool({
  description: "Notify 항목을 추가합니다.",
  inputSchema: z.object({
    title: z.string().describe("공지사항 제목을 입력하세요."),
    content: z.string().describe("공지사항을 구체적으로 작성하세요."),
  }),
  execute: ({ content, title }) => {
    const writer = getWriterFromFile()!;
    const newNotify: Notify = {
      title,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      writer,
      readUsers: [writer],
    };

    const notifyList = getJsonByFile();
    notifyList.push(newNotify);
    saveJsonByFile(notifyList);

    /**
     * @TIP 도구의 결과 기준으로 ai 는 text 응답을 생성하기때문에 아래와 같이
     * 응답 가이드를 return 하는 것도 좋은 방법 입니다.
     */
    return "정상적으로 추가 되었습니다. 사용자에게 잘 등록 되었다고 말하세요.";
  },
});
