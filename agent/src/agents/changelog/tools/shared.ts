import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export const DIR_PATH = join(process.cwd(), "docs");
export const FILE_PATH = join(DIR_PATH, "CHANGELOG.md");

export const getDirPath = () => {
  return DIR_PATH;
};

export const getFilePath = () => {
  return FILE_PATH;
};

export const saveFileByMarkdown = (changelog: string) => {
  // 폴더가 아직 생성되지 않은 경우 폴더 강제 생성
  mkdirSync(DIR_PATH, { recursive: true });

  // 파일 쓰기
  writeFileSync(FILE_PATH, changelog);
};

export const getFileByMarkdown = (): string => {
  if (!existsSync(FILE_PATH)) {
    return "";
  }
  return readFileSync(FILE_PATH, "utf-8") ?? "";
};
