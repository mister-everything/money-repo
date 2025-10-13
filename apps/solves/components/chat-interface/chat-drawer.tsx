"use client";

import { MessageCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ChatInterface } from "./index";
import type { Message } from "./types";

interface ChatDrawerProps {
  /**
   * drawer 열기 트리거 버튼을 렌더링할지 여부
   * @default true
   */
  showTrigger?: boolean;
  /**
   * 트리거 버튼 클래스명
   */
  triggerClassName?: string;
  /**
   * drawer 제목
   * @default "AI 문제 해결 도우미"
   */
  title?: string;
  /**
   * drawer 설명
   * @default "문제에 대해 질문하거나 도움을 요청하세요"
   */
  description?: string;
  /**
   * drawer 최대 너비
   * @default "max-w-2xl"
   */
  maxWidth?: string;
  /**
   * 외부에서 drawer open 상태 제어
   */
  open?: boolean;
  /**
   * drawer open 상태 변경 콜백
   */
  onOpenChange?: (open: boolean) => void;
}

export function ChatDrawer({
  showTrigger = true,
  triggerClassName,
  title = "AI 문제 해결 도우미",
  description = "문제에 대해 질문하거나 도움을 요청하세요",
  maxWidth = "max-w-2xl",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ChatDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 외부에서 제어되는 경우와 내부에서 제어되는 경우 처리
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const handleSendMessage = useCallback(
    async (message: string, option?: string) => {
      // 사용자 메시지 추가
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        sender: "user",
        content: message,
        timestamp: new Date(),
        type: "text",
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // TODO: 실제 API 호출로 교체
        // 임시 응답 시뮬레이션
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          content: `"${option}" 옵션으로 "${message}"에 대한 답변입니다. 이 부분은 실제 AI API 연동 후 교체해야 합니다.`,
          timestamp: new Date(),
          type: "text",
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          sender: "ai",
          content: "죄송합니다. 응답 생성 중 오류가 발생했습니다.",
          timestamp: new Date(),
          type: "error",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return (
    <>
      {showTrigger && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          className={triggerClassName}
          aria-label="AI 채팅 열기"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}

      <Drawer direction="right" open={open} onOpenChange={setOpen}>
        <DrawerContent className={`h-full w-full ${maxWidth}`}>
          <DrawerHeader className="border-b">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              className="h-full border-none rounded-none shadow-none"
              onSendMessage={handleSendMessage}
              messages={messages}
              isLoading={isLoading}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
