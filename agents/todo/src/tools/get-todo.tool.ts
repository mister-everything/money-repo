import { existsSync, readFileSync } from "node:fs";
import { tool } from "ai";
import z from "zod";
import { TODO_FILE_NAME, Todo } from "./todo.interface";

export const getTodo = async (): Promise<Todo[]> => {
  if (existsSync(TODO_FILE_NAME)) {
    const todo = await readFileSync(TODO_FILE_NAME, "utf-8");
    return todo ? JSON.parse(todo) : [];
  }
  return [];
};

// getTodo().then(console.log);

export const getTodoTool = tool({
  name: "getTodo",
  description: "get todo list",
  inputSchema: z.object({}),
  execute: async () => {
    return await getTodo();
  },
});
