"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BotIcon,
  CheckIcon,
  ChevronRight,
  MousePointer2Icon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Types for the simulation steps
type Step =
  | "idle"
  | "ask-question"
  | "ai-thinking"
  | "generating-question"
  | "cursor-moving-to-add"
  | "cursor-clicking-add"
  | "generating-meta"
  | "cursor-moving-to-apply"
  | "cursor-clicking-apply"
  | "complete";

// Button IDs for cursor targeting
const BUTTON_IDS = {
  addToWorkbook: "mock-add-to-workbook-btn",
  applyMeta: "mock-apply-meta-btn",
} as const;

export function MockSimulation() {
  const [step, setStep] = useState<Step>("idle");
  const [messages, setMessages] = useState<
    { role: "ai" | "user"; content: React.ReactNode }[]
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, step]);

  // Simulation Sequence
  useEffect(() => {
    const runSimulation = async () => {
      // 1. Start: AI asks what to create
      if (step === "idle") {
        await new Promise((r) => setTimeout(r, 1000));
        setMessages([
          {
            role: "ai",
            content:
              "안녕하세요! 어떤 문제집을 만들어볼까요? 주제를 알려주시면 제가 도와드릴게요.",
          },
        ]);
        setStep("ask-question");
      }

      // 2. User answers (simulated) - directly show message
      if (step === "ask-question") {
        await new Promise((r) => setTimeout(r, 2000));
        setMessages((prev) => [
          ...prev,
          { role: "user", content: "역사 상식 퀴즈 문제집 만들어줘" },
        ]);
        setStep("ai-thinking");
      }

      // 3. AI Thinking & Tool Use
      if (step === "ai-thinking") {
        await new Promise((r) => setTimeout(r, 1000));
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span>주제를 분석하고 있습니다...</span>
              </div>
            ),
          },
        ]);
        await new Promise((r) => setTimeout(r, 2000));
        setStep("generating-question");
      }

      // 4. Generating a Question Block
      if (step === "generating-question") {
        setMessages((prev) => {
          const newMsgs = [...prev];
          // Replace thinking message with tool usage
          newMsgs[newMsgs.length - 1] = {
            role: "ai",
            content: (
              <div className="space-y-3 w-full max-w-md">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>'역사' 관련 문제를 생성했습니다.</span>
                </div>
                <MockGeneratedBlock />
              </div>
            ),
          };
          return newMsgs;
        });
        await new Promise((r) => setTimeout(r, 1500));
        setStep("cursor-moving-to-add");
      }

      // 4.5 Cursor Interaction for Block
      if (step === "cursor-moving-to-add") {
        await new Promise((r) => setTimeout(r, 1000));
        setStep("cursor-clicking-add");
      }

      if (step === "cursor-clicking-add") {
        await new Promise((r) => setTimeout(r, 800));
        setStep("generating-meta");
      }

      // 5. Generating Meta (Title/Desc)
      if (step === "generating-meta") {
        await new Promise((r) => setTimeout(r, 1000));
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: (
              <div className="space-y-3 w-full max-w-md">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>문제집 제목과 설명을 제안해드려요.</span>
                </div>
                <MockMetaSelection />
              </div>
            ),
          },
        ]);
        await new Promise((r) => setTimeout(r, 2000));
        setStep("cursor-moving-to-apply");
      }

      // 5.5 Cursor Interaction for Meta
      if (step === "cursor-moving-to-apply") {
        await new Promise((r) => setTimeout(r, 1000));
        setStep("cursor-clicking-apply");
      }

      if (step === "cursor-clicking-apply") {
        await new Promise((r) => setTimeout(r, 800));
        setStep("complete");
      }

      // 6. Complete & Restart
      if (step === "complete") {
        await new Promise((r) => setTimeout(r, 5000));
        setMessages([]);
        setStep("idle");
      }
    };

    runSimulation();
  }, [step]);

  return (
    <div
      ref={wrapperRef}
      className="w-full h-[600px] flex flex-col rounded-2xl border bg-background/95 backdrop-blur shadow-2xl overflow-hidden relative cursor-none select-none"
    >
      {/* Header */}
      <div className="h-14 border-b flex items-center px-4 bg-muted/30 gap-3 shrink-0">
        <div className="flex gap-1.5">
          <div className="size-3 rounded-full bg-red-400/80" />
          <div className="size-3 rounded-full bg-amber-400/80" />
          <div className="size-3 rounded-full bg-green-400/80" />
        </div>
        <div className="h-6 w-px bg-border mx-2" />
        <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
          <BotIcon className="size-3.5" />
          Solves AI
        </div>
      </div>

      {/* Chat Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "flex-row",
              )}
            >
              {/* AI Avatar - only for AI messages */}
              {msg.role === "ai" && (
                <Avatar className="size-8 mt-1 shrink-0">
                  <div className="bg-primary/10 size-full flex items-center justify-center">
                    <BotIcon className="size-5 text-primary" />
                  </div>
                </Avatar>
              )}

              <div
                className={cn(
                  "rounded-2xl  py-3 text-sm max-w-[85%]",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm px-4"
                    : "rounded-tl-sm", // AI: no bg, no border
                )}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="h-4" /> {/* Spacer */}
      </div>

      {/* Input Area (Visual only) */}
      <div className="p-4 bg-background border-t">
        <div className="relative">
          <div className="w-full h-12 rounded-full border bg-muted/20 px-4 flex items-center text-sm text-muted-foreground/50 cursor-not-allowed">
            AI에게 메시지 보내기...
          </div>
          <Button
            size="icon"
            className="absolute right-1 top-1 size-10 rounded-full"
            disabled
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      {/* Cursor Animation */}
      <Cursor step={step} containerRef={wrapperRef} />
    </div>
  );
}

function Cursor({
  step,
  containerRef,
}: {
  step: Step;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [position, setPosition] = useState({ x: 300, y: 400 });
  const [isClicking, setIsClicking] = useState(false);

  // Get button position relative to container
  const getButtonPosition = (buttonId: string) => {
    const button = document.getElementById(buttonId);
    const container = containerRef.current;
    if (!button || !container) return null;

    const buttonRect = button.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Position cursor at center of button, relative to container
    return {
      x: buttonRect.left - containerRect.left + buttonRect.width / 2,
      y: buttonRect.top - containerRect.top + buttonRect.height / 2,
    };
  };

  useEffect(() => {
    if (step === "cursor-moving-to-add") {
      // Small delay to ensure DOM is updated
      requestAnimationFrame(() => {
        const pos = getButtonPosition(BUTTON_IDS.addToWorkbook);
        if (pos) setPosition(pos);
      });
    } else if (step === "cursor-clicking-add") {
      setIsClicking(true);
      setTimeout(() => setIsClicking(false), 300);
    } else if (step === "cursor-moving-to-apply") {
      requestAnimationFrame(() => {
        const pos = getButtonPosition(BUTTON_IDS.applyMeta);
        if (pos) setPosition(pos);
      });
    } else if (step === "cursor-clicking-apply") {
      setIsClicking(true);
      setTimeout(() => setIsClicking(false), 300);
    } else if (step === "idle") {
      // Reset to bottom right area
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        setPosition({ x: rect.width - 100, y: rect.height - 100 });
      }
    }
  }, [step, containerRef]);

  return (
    <motion.div
      animate={{ x: position.x, y: position.y, scale: isClicking ? 0.9 : 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="absolute top-0 left-0 z-50 pointer-events-none drop-shadow-xl"
    >
      <MousePointer2Icon className="size-6 text-foreground fill-foreground" />
      <div
        className={cn(
          "absolute -top-1 -left-1 size-8 rounded-full bg-primary/30 animate-ping",
          isClicking ? "block" : "hidden",
        )}
      />
    </motion.div>
  );
}

function MockGeneratedBlock() {
  return (
    <div className="w-full rounded-xl border bg-card p-4 space-y-3 shadow-sm animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className="rounded-full bg-primary/5 text-primary border-primary/20"
        >
          객관식 문제
        </Badge>
        <span className="text-xs text-muted-foreground">방금 생성됨</span>
      </div>

      <div className="space-y-1">
        <p className="font-medium text-sm">임진왜란이 일어난 연도는?</p>
      </div>

      <div className="space-y-2">
        {["1392년", "1592년", "1894년", "1910년"].map((opt, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
              i === 1
                ? "bg-primary/5 border-primary/30"
                : "bg-muted/20 border-transparent",
            )}
          >
            <div
              className={cn(
                "size-4 rounded-full border flex items-center justify-center",
                i === 1
                  ? "border-primary bg-primary text-white"
                  : "border-muted-foreground/30",
              )}
            >
              {i === 1 && <CheckIcon className="size-2.5" />}
            </div>
            <span>{opt}</span>
          </div>
        ))}
      </div>

      <Button
        id={BUTTON_IDS.addToWorkbook}
        size="sm"
        className="w-full text-xs h-8 group-hover:bg-primary"
        variant="outline"
      >
        <CheckIcon className="mr-1.5 size-3" />
        문제집에 추가하기
      </Button>
    </div>
  );
}

function MockMetaSelection() {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSelected((prev) => (prev === 0 ? 1 : 0));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full rounded-xl border bg-card p-4 space-y-4 shadow-sm animate-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">제목 추천</p>
        <div className="space-y-2">
          {["한국사 상식 퀴즈: 조선시대편", "역사 능력 평가: 임진왜란"].map(
            (title, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all duration-300",
                  selected === i
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-muted bg-muted/10 opacity-60",
                )}
              >
                <div
                  className={cn(
                    "size-4 rounded-full border flex items-center justify-center",
                    selected === i
                      ? "border-primary bg-primary"
                      : "border-muted-foreground",
                  )}
                >
                  <div className="size-1.5 bg-white rounded-full" />
                </div>
                <span className="text-sm font-medium">{title}</span>
              </div>
            ),
          )}
        </div>
      </div>

      <Button
        id={BUTTON_IDS.applyMeta}
        size="sm"
        className="w-full text-xs h-8"
      >
        적용하기
      </Button>
    </div>
  );
}
