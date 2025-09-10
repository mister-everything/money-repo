import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { tool } from "ai";
import z from "zod";
import { getTodo } from "./get-todo.tool";
import { TODO_FILE_NAME, Todo } from "./todo.interface";

export const insertTodo = async (
  todo: Omit<Todo, "id" | "done" | "createdAt">,
) => {
  const todos = await getTodo();
  todos.push({
    ...todo,
    id: randomUUID(),
    done: false,
    createdAt: new Date().toISOString(),
  });

  // 디렉토리가 없으면 생성
  await mkdir(dirname(TODO_FILE_NAME), { recursive: true });

  await writeFile(TODO_FILE_NAME, JSON.stringify(todos, null, 2));
};

export const insertTodoTool = tool({
  name: "insertTodo",
  description: "insert todo",
  inputSchema: z.object({
    title: z.string().describe("todo title"),
    writer: z.string().default("anonymous"),
    conetent: z.string().describe("todo conetent"),
  }),
  execute: async (input) => {
    await insertTodo(input);
  },
});

// insertTodo({
//   title: "test",
//   writer: "test",
//   conetent: "test",
//   done: false,
//   createdAt: new Date().toISOString(),
// });
