"use client";

import { useChat } from "@ai-sdk/react";
import { ChatModel, ChatThread } from "@service/solves/shared";
import { deduplicateByKey, generateUUID } from "@workspace/util";
import { ChatOnFinishCallback, DefaultChatTransport, UIMessage } from "ai";
import { LoaderIcon, PlusIcon, SendIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { deleteThreadAction } from "@/actions/chat";
import { Message } from "@/components/chat/message";
import { ModelDropDownMenu } from "@/components/chat/model-drop-down-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToRef } from "@/hooks/use-to-ref";
import { handleErrorToast } from "@/lib/handle-toast";
import { fetcher } from "@/lib/protocol/fetcher";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";
import { notify } from "../ui/notify";
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface WorkbooksCreateChatProps {
  workbookId: string;
}

export function WorkbooksCreateChat({ workbookId }: WorkbooksCreateChatProps) {
  const [threadId, setThreadId] = useState<string>();

  const [tempThreadList, setTempThreadList] = useState<ChatThread[]>([]);

  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);

  const [, deleteAction] = useSafeAction(deleteThreadAction, {
    failMessage: "채팅 삭제에 실패했습니다. 다시 시도해주세요.",
    onBefore: (threadId) => {
      setDeletingThreadId(threadId);
      return threadId;
    },
    onFinish: () => {
      refreshThread();
      setDeletingThreadId(null);
    },
  });

  const {
    data: savedThreadList = [],
    isLoading: isThreadLoading,
    isValidating: isThreadValidating,
    mutate: refreshThread,
  } = useSWR<ChatThread[]>(`/api/workbooks/${workbookId}/chat`, {
    onError: handleErrorToast,
    fallbackData: [],
    onSuccess: (data) => {
      if (latest.current.threadId) return;
      if (data.length > 0) setThreadId(data.at(0)?.id);
      else addNewThread();
    },
    dedupingInterval: 0,
  });

  const [isMessagesLoading, setIsMessagesLoading] = useState(false);

  const [model, setModel] = useState<ChatModel>({
    provider: "openai",
    model: "gpt-4o-mini",
  });

  const latest = useToRef({ model, threadId, tempThreadList });

  const [input, setInput] = useState<string>("");

  const threadList = useMemo(() => {
    const sortByCreatedAtDesc = [...tempThreadList, ...savedThreadList].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return deduplicateByKey(sortByCreatedAtDesc, "id");
  }, [savedThreadList, tempThreadList]);

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

  const isChatPending = useMemo(() => {
    return (
      isMessagesLoading ||
      isThreadValidating ||
      status == "submitted" ||
      status == "streaming"
    );
  }, [isMessagesLoading, isThreadValidating, status]);

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
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !e.nativeEvent.isComposing &&
        !isChatPending
      ) {
        send();
      }
    },
    [send, isChatPending],
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

  const handleThreadClick = useCallback(
    (threadId: string) => {
      if (isChatPending) return;
      setThreadId(threadId);
    },
    [isChatPending],
  );

  const handleDeleteThread = useCallback(
    async (threadId: string) => {
      if (isChatPending) return;
      const isSavedThread = savedThreadList.some((t) => t.id === threadId);
      if (isSavedThread) {
        const isConfirmed = await notify.confirm({
          title: "채팅 삭제",
          description: "정말 삭제하시겠습니까?",
          okText: "삭제",
          cancelText: "취소",
        });
        if (isConfirmed) {
          deleteAction(threadId);
        }
      } else {
        setTempThreadList((prev) => prev.filter((t) => t.id !== threadId));
      }
    },
    [savedThreadList, isChatPending],
  );

  useEffect(() => {
    if (!threadId) return;
    const isSavedThread = savedThreadList.some((t) => t.id === threadId);
    if (!isSavedThread) return;
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
                size="sm"
                variant="ghost"
                onClick={() => handleThreadClick(thread.id)}
                className={cn(
                  "group min-w-0 max-w-40 text-xs",
                  thread.id == threadId ? "bg-input" : "hover:bg-input/50",
                )}
              >
                <span className="flex-1 min-w-0 text-left truncate">
                  {thread.title || "새로운 채팅"}
                </span>

                {deletingThreadId == thread.id ? (
                  <LoaderIcon className="size-3 animate-spin" />
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteThread(thread.id);
                        }}
                        className="shrink-0 hidden group-hover:block hover:bg-background transition-all p-1 rounded-sm"
                      >
                        <XIcon className="size-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>채팅 삭제</TooltipContent>
                  </Tooltip>
                )}
              </Button>
            ))
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={addNewThread}
              className="hover:bg-input! size-8!"
            >
              <PlusIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>새로운 채팅</TooltipContent>
        </Tooltip>
      </div>
      <div
        className={cn(
          "flex-1 overflow-y-auto px-4 py-4",
          isMessagesLoading && "bg-background/20",
        )}
      >
        {!isMessagesLoading &&
          messages.map((message, index) => {
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
      <div className={cn("p-4 flex flex-col gap-2", !threadId && "hidden")}>
        <div className="w-full flex justify-end">
          <ModelDropDownMenu defaultModel={model} onModelChange={setModel} />
        </div>
        <div className="flex gap-2 items-center">
          <Input
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="무엇이든 물어보세요"
            className="bg-background"
          />
          <Button size={"icon"} onClick={() => send()} disabled={isChatPending}>
            <SendIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
