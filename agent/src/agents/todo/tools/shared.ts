import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type Todo = {
  id: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
  content: string;
};

const DIR_PATH = join(process.cwd(), "node_modules", "@solves-agent");
const FILE_PATH = join(DIR_PATH, "todo.json");

export const saveFileByJson = (todoList: Todo[]) => {
  // 폴더가 아직 생성되지 않은 경우 폴더 강제 생성
  mkdirSync(DIR_PATH, { recursive: true });

  // 파일 쓰기
  writeFileSync(FILE_PATH, JSON.stringify(todoList, null, 2));
};

export const getFileByJson = (): Todo[] => {
  if (!existsSync(FILE_PATH)) {
    return [];
  }
  const todoList = readFileSync(FILE_PATH, "utf-8") ?? "[]";
  return JSON.parse(todoList) as Todo[];
};
