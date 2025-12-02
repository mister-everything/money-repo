"use client";

import { useChat } from "@ai-sdk/react";
import { ChatModel, ChatThread } from "@service/solves/shared";
import {
  deduplicateByKey,
  generateUUID,
  truncateString,
} from "@workspace/util";
import { DefaultChatTransport, UIMessage } from "ai";
import { MoreHorizontalIcon, PlusIcon, SendIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Message } from "@/components/chat/message";
import { ModelDropDownMenu } from "@/components/chat/model-drop-down-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToRef } from "@/hooks/use-to-ref";
import { handleErrorToast } from "@/lib/handle-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

interface WorkbooksCreateChatProps {
  workbookId: string;
}

export function WorkbooksCreateChat({ workbookId }: WorkbooksCreateChatProps) {
  const [threadId, setThreadId] = useState(generateUUID());

  const [tempThreadList, setTempThreadList] = useState<ChatThread[]>([
    {
      title: "",
      id: threadId,
      createdAt: new Date(),
    },
  ]);

  const {
    data: savedThreadList = [],
    isLoading: isThreadLoading,
    mutate: refreshThread,
  } = useSWR<ChatThread[]>(`/api/ai/chat/workbook/${workbookId}/threads`, {
    fallbackData: [],
  });

  const isTempChat = useMemo(() => {
    return tempThreadList.some((t) => t.id == threadId);
  }, [tempThreadList, threadId]);

  const { data: initialMessages = [], isValidating: isMessageLoading } = useSWR<
    UIMessage[]
  >(
    isTempChat
      ? null
      : `/api/ai/chat/workbook/${workbookId}/threads/${threadId}/messages`,
    {
      fallbackData: [],
      onSuccess: (data) => {
        console.log({ data });
      },
      revalidateOnFocus: false,
    },
  );

  const [model, setModel] = useState<ChatModel>({
    provider: "openai",
    model: "gpt-4o-mini",
  });

  const latest = useToRef({ model, threadId, tempThreadList });

  const [input, setInput] = useState<string>("");

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    generateId: generateUUID,
    onError: handleErrorToast,
    onFinish: (ctx) => {
      console.log({ ctx });
      if (!ctx.isError) {
        const { threadId, tempThreadList } = latest.current;
        const isTempChat = tempThreadList.some((t) => t.id == threadId);
        if (isTempChat) {
          refreshThread();
        }
      }
    },
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
        createdAt: new Date(),
        id,
        title: "",
      },
      ...prev,
    ]);
    setThreadId(id);
  }, []);

  useEffect(() => {
    return () => {
      const isTemp = tempThreadList.some((t) => t.id == threadId);
      const isSaved = savedThreadList.some((t) => t.id == threadId);
      if (isTemp && isSaved) {
        setTempThreadList((prev) => prev.filter((t) => t.id != threadId));
      }
    };
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
          isMessageLoading && "bg-background/20",
        )}
      >
        {isMessageLoading ? (
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
            disabled={status != "ready" || isMessageLoading}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="무엇이든 물어보세요"
            className="bg-background"
          />
          <Button
            size={"icon"}
            onClick={() => send()}
            disabled={status != "ready" || isMessageLoading}
          >
            <SendIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
