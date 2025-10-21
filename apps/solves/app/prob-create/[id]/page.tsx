"use client";

import type { ProbBlockWithoutAnswer } from "@service/solves/shared";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  ChatInterface,
  HiddenIconBar,
  InitialPromptBox,
  type Message,
  ProbCreateHeader,
  ProblemSetDisplay,
  ResizeBar,
} from "@/components/prob-create";

export default function ProbCreateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [currentId, setCurrentId] = useState<string>(params.id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [problems, setProblems] = useState<ProbBlockWithoutAnswer[]>([]);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(33.333);
  const [isResizing, setIsResizing] = useState(false);

  // 기존 문제집 데이터 로드
  React.useEffect(() => {
    if (params.id !== "new") {
      // TODO: API로 기존 채널 데이터 로드
      // setMessages(...);
      // setProblems(...);
      // setIsChatStarted(true);
    }
  }, [params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      const userMessageContent = inputValue;
      setInputValue("");

      // 첫 메시지 전송 시 새 채널 생성
      if (!isChatStarted && currentId === "new") {
        const newChannelId = `prob-${Date.now()}`;

        // 더미 API: 새 채널 생성
        console.log("📝 Creating new channel:", newChannelId);
        await new Promise((resolve) => setTimeout(resolve, 100));

        setCurrentId(newChannelId);
        // URL만 변경하고 페이지 리렌더링 방지
        window.history.replaceState(null, "", `/prob-create/${newChannelId}`);

        setIsChatStarted(true);
        const welcomeMessage: Message = {
          id: "1",
          type: "ai",
          content:
            "안녕하세요! 문제집 생성을 도와드리겠습니다. 어떤 주제의 문제를 원하시나요?",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }

      const newMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: userMessageContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);

      // 더미 API: AI 응답 생성
      console.log("🤖 Generating AI response...");
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: "네, 이해했습니다! 문제를 생성해드리겠습니다.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiResponse]);

        // 더미 API: 문제 생성
        console.log("📚 Generating problems...");
        const sampleProblems: ProbBlockWithoutAnswer[] = [
          {
            id: crypto.randomUUID(),
            question: "다음 방정식을 풀어보세요: 2x + 5 = 15",
            type: "mcq",
            content: {
              type: "mcq",
              options: [
                { id: "opt-1", type: "text" as const, text: "x = 5" },
                { id: "opt-2", type: "text" as const, text: "x = 10" },
                { id: "opt-3", type: "text" as const, text: "x = 7.5" },
              ],
            },
            order: 0,
          },
          {
            id: crypto.randomUUID(),
            question: "피타고라스 정리를 자신의 말로 설명해보세요.",
            type: "default",
            content: {
              type: "default",
            },
            order: 1,
          },
          {
            id: crypto.randomUUID(),
            question: "x/4 = 3일 때, x의 값은?",
            type: "mcq",
            content: {
              type: "mcq",
              options: [
                { id: "opt-4", type: "text" as const, text: "x = 7" },
                { id: "opt-5", type: "text" as const, text: "x = 12" },
              ],
            },
            order: 2,
          },
        ];
        setProblems(sampleProblems);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const newWidth = (e.clientX / window.innerWidth) * 100;

    if (newWidth < 20) {
      setLeftPanelWidth(0);
    } else if (newWidth > 80) {
      setLeftPanelWidth(80);
    } else {
      setLeftPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="min-h-screen bg-black">
      <ProbCreateHeader />

      <div className="flex h-[calc(100vh-80px)] relative overflow-hidden">
        {isChatStarted && leftPanelWidth === 0 && (
          <HiddenIconBar
            onOpenChat={() => setLeftPanelWidth(33.333)}
            onNewChat={() => router.push("/prob-create/new")}
          />
        )}
        {isChatStarted && (
          <ChatInterface
            messages={messages}
            inputValue={inputValue}
            leftPanelWidth={leftPanelWidth}
            onInputChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onSendMessage={handleSendMessage}
          />
        )}
        {isChatStarted && leftPanelWidth > 0 && (
          <ResizeBar onMouseDown={handleMouseDown} />
        )}

        <div
          className="flex flex-col"
          style={{
            width: `${100 - leftPanelWidth - (isChatStarted && leftPanelWidth === 0 ? 3 : 0)}%`,
          }}
        >
          {!isChatStarted ? (
            <InitialPromptBox
              inputValue={inputValue}
              onInputChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onSendMessage={handleSendMessage}
            />
          ) : (
            <ProblemSetDisplay problems={problems} />
          )}
        </div>
      </div>
    </div>
  );
}
