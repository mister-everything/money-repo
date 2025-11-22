"use client";

import { useChat } from "@ai-sdk/react";
import { ChatModel } from "@service/solves/shared";
import { generateUUID } from "@workspace/util";
import { DefaultChatTransport, UIMessage } from "ai";
import { SendIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Message } from "@/components/chat/message";
import { ModelDropDownMenu } from "@/components/chat/model-drop-down-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToRef } from "@/hooks/use-to-ref";
import { handleErrorToast } from "@/lib/handle-toast";

interface WorkbooksCreateChatProps {
  threadId?: string;
  initialMessages?: UIMessage[];
  workbookId: string;
}

export function WorkbooksCreateChat({
  threadId,
  initialMessages,
  workbookId,
}: WorkbooksCreateChatProps) {
  const [model, setModel] = useState<ChatModel>({
    provider: "openai",
    model: "gpt-4o-mini",
  });

  const ref = useToRef({ model });

  const [input, setInput] = useState<string>("");

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    generateId: generateUUID,
    onError: handleErrorToast,
    transport: new DefaultChatTransport({
      api: "/api/ai/chat/workbook/create",
      prepareSendMessagesRequest: ({ messages }) => {
        return {
          body: {
            messages,
            model: ref.current.model,
            workbookId,
            threadId,
          },
        };
      },
    }),
  });

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

  return (
    <div className="flex flex-col h-full border rounded-2xl">
      <div className="flex-1 overflow-y-auto">
        {messages.length == 0 && (
          <div className="text-center text-muted-foreground h-full flex items-center justify-center">
            채팅을 시작해 보세요.
          </div>
        )}
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
            disabled={status != "ready"}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="ss"
          />
          <Button size={"icon"} onClick={() => send()}>
            <SendIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
