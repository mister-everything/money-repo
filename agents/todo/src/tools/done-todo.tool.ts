import { existsSync, writeFileSync } from "node:fs";
import { Todo, TODO_FILE_NAME } from "./todo.interface";
import { getTodo } from "./get-todo.tool";
import { tool } from "ai";
import { z } from "zod";

export const doneTodo = async (todo: Pick<Todo, "id">): Promise<Todo[]> => {
    if (existsSync(TODO_FILE_NAME)) {
    const todos = await getTodo();
    const doneTodo = todos.find((t) => t.id === todo.id);
    if (!doneTodo) {
      throw new Error("Todo not found");
    }
    todos.find((t) => t.id === todo.id)!.done = true;
    await writeFileSync(TODO_FILE_NAME, JSON.stringify(todos, null, 2));
    return todos;
  }
  return [];
};

export const doneTodoTool = tool({
    name: "doneTodo",
    description: "Done a todo",
    inputSchema: z.object({
        id: z.string().describe("The id of the todo to done"),
    }),
    execute: async ({ id }) => {
        return doneTodo({ id });
    }
});

doneTodo({ id: "9a883794-6624-4f9d-8b56-39c53d18fa5f" }).then(console.log);