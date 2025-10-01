import { Tool, tool } from "ai";
import { z } from "zod";
import {
  filterUnreadNotifies,
  getJsonByFile,
  getWriterFromFile,
  markNotifiesAsRead,
  saveJsonByFile,
} from "./shared";

export const getNotifyListTool: Tool = tool({
  description: "Notify 목록을 조회합니다.",
  inputSchema: z.object({}),
  execute: () => {
    const writer = getWriterFromFile();
    if (!writer) {
      return [];
    }

    // 1. 전체 데이터 조회 (순수하게 데이터만 가져옴)
    const allNotifies = getJsonByFile();

    // 2. 읽지 않은 공지만 필터링
    const unreadNotifies = filterUnreadNotifies(allNotifies, writer);

    // 3. 전체 데이터에 읽음 처리 추가
    const updatedNotifies = markNotifiesAsRead(allNotifies, writer);

    // 4. 읽음 처리된 전체 데이터 저장
    saveJsonByFile(updatedNotifies);

    // 5. 필터링된 (읽지 않은) 데이터 반환
    return unreadNotifies;
  },
});
