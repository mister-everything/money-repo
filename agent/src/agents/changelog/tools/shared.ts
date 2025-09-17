import { createFbStorage } from "@workspace/fb-storage";
import { join } from "path";

export const DIR_PATH = join(process.cwd(), "docs");
export const FILE_PATH = join(DIR_PATH, "CHANGELOG.md");

export const getDirPath = () => {
  return DIR_PATH;
};

export const getFilePath = () => {
  return FILE_PATH;
};

const storage = createFbStorage<string>(FILE_PATH);

export const saveFileByMarkdown = async (changelog: string) => {
  await storage.save(changelog);
};

export const getFileByMarkdown = async (): Promise<string> => {
  if (!(await storage.exists())) {
    return "";
  }
  return (await storage.get()) ?? "";
};
