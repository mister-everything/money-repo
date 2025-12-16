"use client";

import { useChat } from "@ai-sdk/react";
import { ChatThread } from "@service/solves/shared";
import { deduplicateByKey, generateUUID } from "@workspace/util";
import { ChatOnFinishCallback, DefaultChatTransport, UIMessage } from "ai";
import { LoaderIcon, PlusIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { useShallow } from "zustand/shallow";
import { deleteThreadAction } from "@/actions/chat";
import { ChatErrorMessage, Message } from "@/components/chat/message";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/notify";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChatModelList } from "@/hooks/query/use-chat-model-list";
import { useToRef } from "@/hooks/use-to-ref";
import { handleErrorToast } from "@/lib/handle-toast";
import { fetcher } from "@/lib/protocol/fetcher";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";
import { useAiStore } from "@/store/ai-store";
import { WorkbookOptions } from "@/store/types";
import { useWorkbookEditStore } from "@/store/workbook-edit-store";
import PromptInput from "../chat/prompt-input";
import { WorkbookEditOptions } from "./workbook-edit-options";

interface WorkbooksCreateChatProps {
  workbookId: string;
}

export function WorkbooksCreateChat({ workbookId }: WorkbooksCreateChatProps) {
  const [threadId, setThreadId] = useState<string>();

  const [tempThreadList, setTempThreadList] = useState<ChatThread[]>([]);

  const [workbookOption, _setWorkbookOption] = useWorkbookEditStore(
    useShallow((state) => [
      state.workbookOptions[workbookId],
      state.setWorkbookOption,
    ]),
  );
  const setWorkbookOption = useCallback(
    (options: WorkbookOptions) => {
      _setWorkbookOption(workbookId, options);
    },
    [workbookId, _setWorkbookOption],
  );

  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(false);

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
  const { chatModel, setChatModel } = useAiStore();
  useChatModelList({
    onSuccess: (data) => {
      const defaultModel = data.find((m) => m.isDefaultModel) || data.at(0);
      if (!chatModel && defaultModel) setChatModel(defaultModel);
    },
  });

  const [isMessagesLoading, setIsMessagesLoading] = useState(false);

  const latest = useToRef({ chatModel, threadId, tempThreadList });

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

  const {
    messages,
    sendMessage,
    status,
    error,
    clearError,
    setMessages,
    stop,
  } = useChat({
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
            model: latest.current.chatModel,
            workbookId,
            threadId: id,
          },
        };
      },
    }),
  });

  const isChatPending = useMemo(() => {
    return status == "submitted" || status == "streaming";
  }, [status]);

  const isPending = useMemo(() => {
    return isMessagesLoading || isThreadValidating || isChatPending;
  }, [isMessagesLoading, isThreadValidating, isChatPending]);

  const fetchThreadMessages = useCallback(async (threadId: string) => {
    try {
      setIsMessagesLoading(true);
      const response = await fetcher<UIMessage[]>(`/api/ai/chat/${threadId}`);
      setMessages(response);
    } catch (error) {
      setMessages([]);
      handleErrorToast(error);
    } finally {
      setIsMessagesLoading(false);
    }
  }, []);

  const send = useCallback(
    (text: string = input) => {
      if (status != "ready" || !threadId || Boolean(error) || !text?.trim())
        return;
      setInput("");
      sendMessage({
        role: "user",
        parts: [{ type: "text", text }],
      });
    },
    [input, status, threadId, error],
  );

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
      if (isPending) return;
      setThreadId(threadId);
    },
    [isPending],
  );

  const handleDeleteThread = useCallback(
    async (threadId: string) => {
      if (isPending) return;
      const isSavedThread = savedThreadList.some((t) => t.id === threadId);

      const focusTempThread = () => {
        const tempThread = tempThreadList[0];
        if (!tempThread) addNewThread();
        else setThreadId(tempThread.id);
      };

      if (isSavedThread) {
        const isConfirmed = await notify.confirm({
          title: "채팅 삭제",
          description: "정말 삭제하시겠습니까?",
          okText: "삭제",
          cancelText: "취소",
        });
        if (!isConfirmed) return;
        deleteAction(threadId);
      } else {
        setTempThreadList((prev) => prev.filter((t) => t.id !== threadId));
      }
      focusTempThread();
    },
    [tempThreadList, savedThreadList, isPending],
  );

  const handleClearError = useCallback(() => {
    const isSavedThread = savedThreadList.some((t) => t.id === threadId);
    if (isSavedThread) {
      fetchThreadMessages(threadId!);
    } else {
      setMessages([]);
    }
    clearError();
  }, [clearError, threadId, savedThreadList]);

  useEffect(() => {
    if (!threadId) return;
    const isSavedThread = savedThreadList.some((t) => t.id === threadId);
    if (!isSavedThread) return;
    fetchThreadMessages(threadId);
  }, [threadId]);

  useEffect(() => {
    if (autoScrollRef.current || messages.at(-1)?.role == "user") {
      messagesContainerRef.current?.scrollTo({
        top: messagesContainerRef.current?.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    const isLoading = status == "submitted" || status == "streaming";
    if (isLoading) {
      autoScrollRef.current = true;
      const handleScroll = () => {
        const el = messagesContainerRef.current!;
        const isAtBottom =
          el.scrollHeight - el.scrollTop - el.clientHeight < 20;
        if (!isAtBottom) {
          autoScrollRef.current = false;
        }
      };
      messagesContainerRef.current?.addEventListener("scroll", handleScroll);
      return () => {
        messagesContainerRef.current?.removeEventListener(
          "scroll",
          handleScroll,
        );
      };
    }
  }, [status]);

  useEffect(() => {
    if (!isMessagesLoading) {
      messagesContainerRef.current?.scrollTo({
        top: messagesContainerRef.current?.scrollHeight,
      });
    }
  }, [isMessagesLoading]);

  useEffect(() => {
    if (error) {
      messagesContainerRef.current?.scrollTo({
        top: messagesContainerRef.current?.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [error]);

  return (
    <div className="flex flex-col h-full border rounded-2xl bg-sidebar relative">
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
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteThread(thread.id);
                    }}
                    className="shrink-0 hidden group-hover:block hover:bg-background transition-all p-1 rounded-sm"
                  >
                    <XIcon className="size-3" />
                  </span>
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
        ref={messagesContainerRef}
        className={cn(
          "flex-1 overflow-y-auto px-4 py-4 pb-40 relative",
          isMessagesLoading && "bg-background/20",
        )}
      >
        {!isMessagesLoading && (
          <>
            {messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1;
              return (
                <Message
                  key={index}
                  message={message}
                  isLastMessage={isLastMessage}
                  status={status}
                  className={
                    !isLastMessage || error
                      ? undefined
                      : message.role == "assistant"
                        ? "min-h-[calc(65dvh-30px)]"
                        : "min-h-[calc(65dvh+70px)]"
                  }
                />
              );
            })}
          </>
        )}
        {error && (
          <div className="p-4 my-6">
            <ChatErrorMessage error={error} clearError={handleClearError} />
          </div>
        )}
      </div>
      <div className={cn("p-2 absolute bottom-0 left-0 right-0")}>
        <WorkbookEditOptions
          options={workbookOption}
          setOptions={setWorkbookOption}
        />
        <PromptInput
          input={input}
          onChange={setInput}
          onEnter={send}
          placeholder="무엇이든 물어보세요"
          disabledSendButton={
            (!isChatPending && isPending) || !threadId || Boolean(error)
          }
          chatModel={chatModel}
          onChatModelChange={setChatModel}
          onSendButtonClick={() => (isChatPending ? stop() : send())}
        />
      </div>
    </div>
  );
}
