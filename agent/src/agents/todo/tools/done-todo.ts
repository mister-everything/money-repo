import { Tool, tool } from "ai";
import { z } from "zod";
import { getFileByJson, saveFileByJson } from "./shared";

export const doneTodoTool: Tool = tool({
  description: "TODO 항목을 완료합니다.",
  inputSchema: z.object({
    id: z.string(),
  }),
  execute: ({ id }) => {
    const todoList = getFileByJson();
    const todo = todoList.find((todo) => todo.id === id);
    if (!todo) {
      return "해당 TODO 항목을 찾을 수 없습니다.";
    }
    todo.done = true;
    todo.updatedAt = new Date().toISOString();
    saveFileByJson(todoList);

    return "정상적으로 완료 되었습니다. 사용자에게 다른 할일 이 있으면 말하세요.";
  },
});
