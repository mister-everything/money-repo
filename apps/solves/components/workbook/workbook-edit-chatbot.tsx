"use client";

import { useChat } from "@ai-sdk/react";
import { ChatModel, ChatThread } from "@service/solves/shared";
import {
  deduplicateByKey,
  generateUUID,
  truncateString,
} from "@workspace/util";
import { ChatOnFinishCallback, DefaultChatTransport, UIMessage } from "ai";
import { MoreHorizontalIcon, PlusIcon, SendIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Message } from "@/components/chat/message";
import { ModelDropDownMenu } from "@/components/chat/model-drop-down-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToRef } from "@/hooks/use-to-ref";
import { handleErrorToast } from "@/lib/handle-toast";
import { fetcher } from "@/lib/protocol/fetcher";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

interface WorkbooksCreateChatProps {
  workbookId: string;
}

export function WorkbooksCreateChat({ workbookId }: WorkbooksCreateChatProps) {
  const [threadId, setThreadId] = useState(() => generateUUID());

  const [tempThreadList, setTempThreadList] = useState<ChatThread[]>(() => {
    return [
      {
        id: threadId,
        title: "",
        createdAt: new Date(),
      },
    ];
  });

  const {
    data: savedThreadList = [],
    isLoading: isThreadLoading,
    mutate: refreshThread,
  } = useSWR<ChatThread[]>(`/api/workbooks/${workbookId}/chat`, {
    onError: handleErrorToast,
    fallbackData: [],
    dedupingInterval: 0,
  });

  const [isMessagesLoading, setIsMessagesLoading] = useState(false);

  const [model, setModel] = useState<ChatModel>({
    provider: "openai",
    model: "gpt-4o-mini",
  });

  const latest = useToRef({ model, threadId, tempThreadList });

  const [input, setInput] = useState<string>("");

  const onFinish = useCallback<ChatOnFinishCallback<UIMessage>>(async (ctx) => {
    if (ctx.isError) return;

    const { threadId, tempThreadList } = latest.current;

    const isTempChat = tempThreadList.some((t) => t.id == threadId);
    if (!isTempChat) return;

    const refreshData = await refreshThread();
    const isSaved = refreshData?.some((t) => t.id == threadId);
    if (isSaved) {
      return setTempThreadList((prev) => prev.filter((t) => t.id != threadId));
    }
    toast.error("채팅에 문제가 발생했습니다. 다시 시도해주세요.");
    addNewThread();
  }, []);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: threadId,
    generateId: generateUUID,
    onError: handleErrorToast,
    onFinish,
    transport: new DefaultChatTransport({
      api: "/api/ai/chat/workbook/create",
      prepareSendMessagesRequest: ({ messages, id }) => {
        return {
          body: {
            messages,
            model: latest.current.model,
            workbookId,
            threadId: id,
          },
        };
      },
    }),
  });

  const threadList = useMemo(() => {
    const sortByCreatedAtDesc = [...tempThreadList, ...savedThreadList].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return deduplicateByKey(sortByCreatedAtDesc, "id");
  }, [savedThreadList, tempThreadList]);

  const fetchThreadMessages = useCallback(async (threadId: string) => {
    try {
      setIsMessagesLoading(true);
      const response = await fetcher<UIMessage[]>(`/api/ai/chat/${threadId}`);
      return response;
    } catch (error) {
      handleErrorToast(error);
    } finally {
      setIsMessagesLoading(false);
    }
  }, []);

  const send = useCallback(
    (text: string = input) => {
      if (status != "ready") return;
      setInput("");
      sendMessage({
        role: "user",
        parts: [{ type: "text", text }],
      });
    },
    [input, status],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        send();
      }
    },
    [send],
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.currentTarget.value);
  }, []);

  const addNewThread = useCallback(() => {
    const id = generateUUID();
    setTempThreadList((prev) => [
      {
        id,
        title: "",
        createdAt: new Date(),
      },
      ...prev,
    ]);
    setThreadId(id);
  }, []);

  useEffect(() => {
    const isTempThread = tempThreadList.some((t) => t.id === threadId);
    if (isTempThread) return;
    fetchThreadMessages(threadId)
      .then((messages) => {
        setMessages(messages ?? []);
      })
      .catch(() => {
        setMessages([]);
      });
  }, [threadId]);

  return (
    <div className="flex flex-col h-full border rounded-2xl bg-sidebar">
      <div className="flex items-center p-2">
        <div className="flex-1 overflow-x-auto flex gap-1">
          {isThreadLoading ? (
            <>
              <Skeleton className="w-28 h-8 bg-input" />
              <Skeleton className="w-20 h-8 bg-input" />
              <Skeleton className="w-32 h-8 bg-input" />
              <Skeleton className="w-28 h-8 bg-input" />
            </>
          ) : (
            threadList.map((thread) => (
              <Button
                key={thread.id}
                size={"sm"}
                variant="secondary"
                onClick={() => setThreadId(thread.id)}
                disabled={
                  isMessagesLoading || isThreadLoading || status != "ready"
                }
                className={cn("min-w-0", thread.id == threadId && "bg-input")}
              >
                {truncateString(thread.title || "새로운 채팅", 10)}
              </Button>
            ))
          )}
        </div>
        <Button size="icon" variant="ghost" onClick={addNewThread}>
          <PlusIcon />
        </Button>
        <Button size="icon" variant="ghost">
          <MoreHorizontalIcon />
        </Button>
      </div>
      <div
        className={cn(
          "flex-1 overflow-y-auto px-4 py-4",
          isMessagesLoading && "bg-background/20",
        )}
      >
        {isMessagesLoading ? (
          <Skeleton className="w-full h-14 bg-input" />
        ) : null}
        {messages.map((message, index) => {
          return (
            <Message
              key={index}
              message={message}
              isLastMessage={index === messages.length - 1}
              status={status}
            />
          );
        })}
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="w-full flex justify-end">
          <ModelDropDownMenu defaultModel={model} onModelChange={setModel} />
        </div>
        <div className="flex gap-2 items-center">
          <Input
            value={input}
            disabled={status != "ready" || isMessagesLoading}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="무엇이든 물어보세요"
            className="bg-background"
          />
          <Button
            size={"icon"}
            onClick={() => send()}
            disabled={status != "ready" || isMessagesLoading}
          >
            <SendIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
