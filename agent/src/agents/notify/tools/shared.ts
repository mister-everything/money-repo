import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Notify } from "../types";

const WRITER_DIR_PATH = join(process.cwd(), "node_modules", "@local-agent");
const WRITER_FILE_PATH = join(WRITER_DIR_PATH, "notify-writer.txt");

export const saveWriterToFile = (writer: string) => {
  // 폴더가 아직 생성되지 않은 경우 폴더 강제 생성
  mkdirSync(WRITER_DIR_PATH, { recursive: true });
  // 파일 쓰기
  writeFileSync(WRITER_FILE_PATH, writer);
};

// json으로 저장할 필요없고 텍스트로
export const getWriterFromFile = (): string | null => {
  if (!existsSync(WRITER_FILE_PATH)) {
    return null;
  }
  const writerData = readFileSync(WRITER_FILE_PATH, "utf-8");
  return writerData;
};

const NOTIFY_DIR_PATH = join(process.cwd(), "src/agents/notify/history");
const NOTIFY_FILE_PATH = join(NOTIFY_DIR_PATH, "notify.json");

export const getJsonByFile = (): Notify[] => {
  if (!existsSync(NOTIFY_FILE_PATH)) {
    return [];
  }
  const writer = getWriterFromFile();
  const notifyList = readFileSync(NOTIFY_FILE_PATH, "utf-8") ?? "[]";

  const data = (JSON.parse(notifyList) as Notify[]).filter(
    (notify) => !notify.readUsers.includes(writer || ""),
  );

  saveJsonByFile(
    data.map((notify) => ({
      ...notify,
      readUsers: [...notify.readUsers, writer || ""],
    })),
  );
  return data;
};

export const saveJsonByFile = (data: Notify[]) => {
  mkdirSync(NOTIFY_DIR_PATH, { recursive: true });
  writeFileSync(NOTIFY_FILE_PATH, JSON.stringify(data, null, 2));
};
