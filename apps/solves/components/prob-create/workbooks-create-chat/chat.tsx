"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Message } from "./message";

interface WorkbooksCreateChatProps {
  threadId: string;
}
export function WorkbooksCreateChat({ threadId }: WorkbooksCreateChatProps) {
  const [input, setInput] = useState<string>("");

  const { messages, sendMessage } = useChat({
    id: threadId,
    transport: new DefaultChatTransport({
      api: "/api/ai/workbook-chat/create",
      prepareSendMessagesRequest: ({ messages }) => {
        return {
          body: {
            messages,
            model: { provider: "openai", model: "gpt-4o-mini" },
          },
        };
      },
    }),
    // messages: messages,
    experimental_throttle: 100,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
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
