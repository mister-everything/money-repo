import { join } from "node:path";

export type Todo = {
  id: string;
  title: string;
  writer: string;
  conetent: string;
  done: boolean;
  createdAt: string;
};

export const TODO_FILE_NAME = join(
  process.cwd(),
  "node_modules/@todo/todo.json",
);
