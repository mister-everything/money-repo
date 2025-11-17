"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { useState } from "react";
import { PreviewMessage } from "@/components/chat/message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [input, setInput] = useState<string>("");

  const { messages, sendMessage } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/ai/chat/workbook/create",

      prepareSendMessagesRequest: ({ messages }) => {
        return {
          body: {
            messages,
            model: { provider: "openai", model: "gpt-4o-mini" },
            workbookId,
          },
        };
      },
    }),
    experimental_throttle: 100,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.map((message) => (
          <PreviewMessage key={message.id} message={message} />
        ))}
      </div>

      <Input
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
        }}
        placeholder="ss"
      />
      <Button
        onClick={() => {
          sendMessage({
            role: "user",
            parts: [{ type: "text", text: input }],
          });
        }}
      >
        Send
      </Button>
    </div>
  );
}
