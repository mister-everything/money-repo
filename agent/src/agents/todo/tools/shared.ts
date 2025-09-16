import { createFsJsonStorage } from "@workspace/fb-storage";
import { join } from "path";

export type Todo = {
  id: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
  content: string;
};

const DIR_PATH = join(process.cwd(), "node_modules", "@local-agent");
const FILE_PATH = join(DIR_PATH, "todo.json");

export const storage = createFsJsonStorage<Todo[]>(FILE_PATH);
