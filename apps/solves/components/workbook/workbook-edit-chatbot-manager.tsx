"use client";

import { generateUUID } from "@workspace/util";
import { UIMessage } from "ai";
import { useCallback, useMemo, useState } from "react";
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

  // 무조건 새로운 채팅방 생성 (커서맹키로)
  const [currentThreadId, setCurrentThreadId] = useState<string>(() =>
    generateUUID(),
  );

  const handleNewChat = useCallback(() => {
    const newThreadId = generateUUID();
    setCurrentThreadId(newThreadId);
  }, []);

  const handleThreadChange = useCallback((threadId: string) => {
    setCurrentThreadId(threadId);
  }, []);

  const hasPersistedThread =
    !!currentThreadId &&
    threads.some((thread) => thread.id === currentThreadId);

  const { data: initialMessages } = useSWR<UIMessage[]>(
    hasPersistedThread && currentThreadId
      ? `/api/ai/chat/workbook/${workbookId}/threads/${currentThreadId}/messages`
      : null,
    fetcher,
  );

  const header = useMemo(
    () => (
      <WorkbookEditChatTabs
        threads={threads}
        currentThreadId={currentThreadId}
        onThreadChange={handleThreadChange}
        onNewChat={handleNewChat}
      />
    ),
    [threads, currentThreadId, handleThreadChange, handleNewChat],
  );

  if (!currentThreadId) {
    return <div className="h-full rounded-2xl border bg-sidebar" />;
  }

  return (
    <WorkbooksCreateChat
      threadId={currentThreadId}
      workbookId={workbookId}
      initialMessages={initialMessages}
      header={header}
    />
  );
}
