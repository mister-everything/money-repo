"use client";

import { generateUUID } from "@workspace/util";
import { useCallback, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/protocol/fetcher";
import {
  type ChatThread,
  WorkbookEditChatTabs,
} from "./workbook-edit-chat-tabs";
import { WorkbooksCreateChat } from "./workbook-edit-chatbot";

interface WorkbooksCreateChatManagerProps {
  workbookId: string;
}

export function WorkbooksCreateChatManager({
  workbookId,
}: WorkbooksCreateChatManagerProps) {
  // workbookId로 채팅방 리스트 조회
  const { data: threads = [] } = useSWR<ChatThread[]>(
    `/api/ai/chat/workbook/${workbookId}/threads`,
    fetcher,
    {
      onError: (err) => {
        // 에러가 발생해도 빈 배열로 처리 (새 문제집의 경우 thread가 없을 수 있음)
        console.error("Failed to fetch threads:", err);
      },
    },
  );

  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(
    // 일단 새 채팅 임시 아이디 생성
    () => generateUUID(),
  );

  // 새 채팅 생성
  const handleNewChat = useCallback(() => {
    const newThreadId = generateUUID();
    setCurrentThreadId(newThreadId);
  }, []);

  // thread 변경
  const handleThreadChange = useCallback((threadId: string) => {
    setCurrentThreadId(threadId);
  }, []);

  return (
    <WorkbookEditChatTabs
      threads={threads}
      currentThreadId={currentThreadId}
      onThreadChange={handleThreadChange}
      onNewChat={handleNewChat}
    >
      {(threadId) => (
        <WorkbooksCreateChat
          threadId={threadId}
          workbookId={workbookId}
          // initialMessages={/* threadId로 메시지 조회 */}
        />
      )}
    </WorkbookEditChatTabs>
  );
}
