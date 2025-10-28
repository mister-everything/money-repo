"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  placeholder?: string;
}

// 더미 대화 데이터
const dummyMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "문제 초안을 만들었어요. 확인해보시고 수정이 필요하신 부분을 말씀해주세요.",
    timestamp: new Date(),
  },
  {
    id: "2",
    role: "user",
    content:
      "전체적으로 너무 쉬워서 난이도를 높여도 될 것 같아. 특히 3번까지는 관찰력만 좋으면 쉽게 풀 수 있을 것 같아서",
    timestamp: new Date(),
  },
  {
    id: "3",
    role: "assistant",
    content:
      "알겠습니다. 1~3번 문제의 난이도를 높여볼게요. 단순 관찰력보다는 논리적 사고가 필요하도록 조건을 추가하고, 함정 요소를 넣어서 신중하게 접근해야 하도록 수정하겠습니다.",
    timestamp: new Date(),
  },
  {
    id: "4",
    role: "user",
    content: "좋아, 그리고 5번 문제는 시간 복잡도를 고려하는 문제로 바꿔줄래?",
    timestamp: new Date(),
  },
  {
    id: "5",
    role: "assistant",
    content:
      "네, 5번 문제를 시간 복잡도 최적화가 필요한 알고리즘 문제로 변경하겠습니다. O(n²)으로 풀면 시간 초과가 나고, O(n log n) 이하로 최적화해야 하는 문제로 만들어볼게요.",
    timestamp: new Date(),
  },
];

export function ChatPanel({
  messages = dummyMessages,
  onSendMessage,
  placeholder = "AI에게 문제 수정 요청을 입력해주세요...",
}: ChatPanelProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && onSendMessage) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground">문제 수정</h3>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[60px] resize-none"
            rows={2}
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
