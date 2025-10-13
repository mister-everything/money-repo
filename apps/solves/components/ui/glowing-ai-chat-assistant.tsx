import { Bot, MessageCircle, Send, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
};

const FloatingAiAssistant: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [charCount, setCharCount] = useState(0);
  const maxChars = 2000;
  const chatRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const quickPrompts = useMemo(
    () => ["이 문제 풀이 전략을 알려줘", "핵심 개념만 요약해줘"],
    [],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isChatOpen]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setMessage(value);
    setCharCount(value.length);
  };

  const handleSend = () => {
    if (!message.trim()) {
      return;
    }

    const timestamp = new Date().toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: message.trim(),
      timestamp,
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
    setCharCount(0);

    setTimeout(() => {
      const reply: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "AI 응답 예시입니다. 실제 연동 시 여기에 답변을 표시합니다.",
        timestamp: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, reply]);
    }, 600);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(".floating-ai-button")) {
        return;
      }

      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setIsChatOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!messages.length) {
      setMessages([
        {
          id: generateId(),
          role: "assistant",
          content:
            "안녕하세요! 무엇을 도와드릴까요? 문제 이해부터 힌트 제공까지 도와드릴게요.",
          timestamp: new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }
  }, [messages.length]);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 items-end justify-center px-4 sm:left-auto sm:right-6 sm:w-auto sm:max-w-none sm:translate-x-0 sm:px-0">
      <button
        className={`floating-ai-button relative flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-300 ${
          isChatOpen ? "scale-95" : "scale-100"
        }`}
        onClick={() => setIsChatOpen(!isChatOpen)}
      >
        <span className="absolute inset-0 rounded-full bg-background shadow-lg shadow-black/30" />
        <span className="absolute inset-[2px] rounded-full border border-border bg-background" />
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          {isChatOpen ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </span>
      </button>
      {/* Chat Interface */}
      {isChatOpen && (
        <div
          ref={chatRef}
          className="absolute bottom-20 left-1/2 w-[calc(100vw-2rem)] max-w-[480px] -translate-x-1/2 transition-all duration-300 origin-bottom sm:w-[380px] sm:left-auto sm:translate-x-0 sm:right-0"
          style={{
            animation:
              "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
          }}
        >
          <div className="relative flex flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-xl">
            {/* Header */}
            <div className="relative flex items-start justify-between gap-3 px-5 py-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/90 text-primary-foreground shadow-sm">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Solves Bot
                    </p>
                    <p className="text-xs text-muted-foreground">
                      AI 튜터와 함께 실시간으로 문제를 해결하세요
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsChatOpen(false)}
                className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="채팅창 닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Suggested prompts */}
            <div className="relative border-y border-border bg-muted/40 px-5 py-3">
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setMessage(prompt);
                      setCharCount(prompt.length);
                    }}
                    className="group inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                  >
                    <MessageCircle className="h-3 w-3 text-primary transition group-hover:text-primary" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex max-h-[360px] min-h-[220px] flex-col gap-4 overflow-y-auto px-5 py-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted scrollbar-thumb-rounded-full"
            >
              {messages.map((item) => (
                <div key={item.id} className="flex flex-col gap-1">
                  <div
                    className={`flex ${
                      item.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition ${
                        item.role === "user"
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md border border-border bg-muted text-foreground"
                      }`}
                    >
                      {item.content}
                    </div>
                  </div>
                  <div
                    className={`text-[10px] ${
                      item.role === "user"
                        ? "mr-1 text-right text-muted-foreground"
                        : "ml-1 text-left text-muted-foreground"
                    }`}
                  >
                    {item.timestamp}
                  </div>
                </div>
              ))}

              {!messages.length && (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  최근 대화 내역이 없습니다. 무엇이든 질문해 보세요!
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="relative border-t border-border bg-muted/30 px-5 py-4">
              <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>문장을 엔터로 전송, Shift+Enter 로 줄바꿈</span>
                <span className="font-medium">
                  {charCount} / {maxChars}
                </span>
              </div>

              <div className="relative rounded-2xl border border-border bg-background focus-within:border-primary/60">
                <textarea
                  value={message}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  rows={3}
                  maxLength={maxChars}
                  placeholder="질문이나 요청을 입력하세요..."
                  className="w-full resize-none rounded-2xl bg-transparent px-4 pb-12 pt-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />

                <div className="absolute inset-x-4 bottom-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary"></span>
                      실시간 응답 대기중
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={handleSend}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!message.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(1.1);
            opacity: 0;
          }
        }
        
        .floating-ai-button:hover {
          transform: scale(1.07);
        }
      `}</style>
    </div>
  );
};

export { FloatingAiAssistant };
