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

export const getWriterFromFile = (): string | null => {
  if (!existsSync(WRITER_FILE_PATH)) {
    return null;
  }
  const writerData = readFileSync(WRITER_FILE_PATH, "utf-8");
  return writerData;
};

const NOTIFY_DIR_PATH = join(process.cwd(), "src/agents/notify/history");
const NOTIFY_FILE_PATH = join(NOTIFY_DIR_PATH, "notify.json");

// 순수하게 전체 데이터만 가져오는 함수
export const getJsonByFile = (): Notify[] => {
  if (!existsSync(NOTIFY_FILE_PATH)) {
    return [];
  }
  const notifyList = readFileSync(NOTIFY_FILE_PATH, "utf-8") ?? "[]";
  return JSON.parse(notifyList) as Notify[];
};

export const saveJsonByFile = (data: Notify[]) => {
  mkdirSync(NOTIFY_DIR_PATH, { recursive: true });
  writeFileSync(NOTIFY_FILE_PATH, JSON.stringify(data, null, 2));
};

// 읽지 않은 공지만 필터링하는 함수 (새로 추가)
export const filterUnreadNotifies = (
  notifies: Notify[],
  writer: string,
): Notify[] => {
  return notifies.filter((notify) => !notify.readUsers.includes(writer));
};

// 읽음 처리를 하는 함수 (새로 추가)
export const markNotifiesAsRead = (
  notifies: Notify[],
  writer: string,
): Notify[] => {
  return notifies.map((notify) => {
    if (!notify.readUsers.includes(writer)) {
      return {
        ...notify,
        readUsers: [...notify.readUsers, writer],
      };
    }
    return notify;
  });
};
