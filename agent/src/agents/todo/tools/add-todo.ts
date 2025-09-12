import { generateUUID } from "@workspace/util";
import { Tool, tool } from "ai";
import { z } from "zod";
import { getFileByJson, saveFileByJson } from "./shared";

export const addTodoTool: Tool = tool({
  description: "TODO 항목을 추가합니다.",
  inputSchema: z.object({
    content: z.string().describe("할 일을 구체적으로 작성하세요."),
  }),
  execute: ({ content }) => {
    const todoList = getFileByJson();
    const newTodo = {
      id: generateUUID(),
      done: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content,
    };

    todoList.push(newTodo);
    saveFileByJson(todoList);

    // 도구의 결과 기준으로 ai 는 text 응답을 생성하기때문에 아래와 같이
    // 응답 가이드를 return 하는 것도 좋은 방법 입니다.
    return "정상적으로 추가 되었습니다. 사용자에게 잘 등록 되었다고 말하세요.";
  },
});
