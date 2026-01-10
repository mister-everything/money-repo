"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BrainIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  GlobeIcon,
  MousePointer2Icon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Button IDs for cursor targeting
const BUTTON_IDS = {
  optionB: "mock-ai-option-b",
} as const;

type Step =
  | "idle"
  | "focus-question"
  | "web-searching"
  | "ai-thinking-1"
  | "ai-thinking-2"
  | "ai-thinking-3"
  | "cursor-move-to-answer"
  | "cursor-click-answer"
  | "show-result"
  | "complete";

interface ThinkingStep {
  text: string;
  detail: string;
}

const thinkingSteps: ThinkingStep[] = [
  {
    text: "문제를 분석하고 있습니다...",
    detail: "뉴턴의 운동 제2법칙 F=ma를 적용해야 해요.",
  },
  {
    text: "핵심 공식을 적용합니다...",
    detail: "질량이 2배가 되면 a = F/2m이 됩니다.",
  },
  {
    text: "정답을 도출합니다!",
    detail: "가속도는 질량에 반비례하므로 1/2배가 됩니다.",
  },
];

const searchResults = [
  { title: "뉴턴의 운동 법칙 - 위키백과", url: "ko.wikipedia.org" },
  { title: "F=ma 공식 해설 - 물리학백과", url: "physics.com" },
];

const options = [
  { id: "A", label: "2배가 된다", correct: false },
  { id: "B", label: "1/2배가 된다", correct: true },
  { id: "C", label: "변화 없다", correct: false },
  { id: "D", label: "4배가 된다", correct: false },
];

// Typewriter Hook
function useTypewriter(text: string, isActive: boolean, speed: number = 25) {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    if (!isActive) {
      setDisplayText("");
      return;
    }

    let i = 0;
    setDisplayText("");

    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, isActive, speed]);

  return displayText;
}

export function MockAiSolver() {
  const [step, setStep] = useState<Step>("idle");
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const runSimulation = async () => {
      if (step === "idle") {
        await new Promise((r) => setTimeout(r, 1000));
        setStep("focus-question");
      }

      if (step === "focus-question") {
        setIsFocused(true);
        await new Promise((r) => setTimeout(r, 800));
        setStep("web-searching");
      }

      if (step === "web-searching") {
        await new Promise((r) => setTimeout(r, 2500));
        setStep("ai-thinking-1");
      }

      if (step === "ai-thinking-1") {
        setThinkingIndex(0);
        await new Promise((r) => setTimeout(r, 2500));
        setStep("ai-thinking-2");
      }

      if (step === "ai-thinking-2") {
        setThinkingIndex(1);
        await new Promise((r) => setTimeout(r, 2500));
        setStep("ai-thinking-3");
      }

      if (step === "ai-thinking-3") {
        setThinkingIndex(2);
        await new Promise((r) => setTimeout(r, 2000));
        setStep("cursor-move-to-answer");
      }

      if (step === "cursor-move-to-answer") {
        await new Promise((r) => setTimeout(r, 800));
        setStep("cursor-click-answer");
      }

      if (step === "cursor-click-answer") {
        setSelectedAnswer("B");
        await new Promise((r) => setTimeout(r, 500));
        setStep("show-result");
      }

      if (step === "show-result") {
        await new Promise((r) => setTimeout(r, 4000));
        setStep("complete");
      }

      if (step === "complete") {
        await new Promise((r) => setTimeout(r, 1000));
        setSelectedAnswer(null);
        setIsFocused(false);
        setThinkingIndex(0);
        setStep("idle");
      }
    };

    runSimulation();
  }, [step]);

  const isThinking =
    step === "ai-thinking-1" ||
    step === "ai-thinking-2" ||
    step === "ai-thinking-3";

  const isSearching = step === "web-searching";

  return (
    <div ref={containerRef} className="w-full max-w-md relative select-none">
      {/* Problem Card with Focus Effect */}
      <motion.div
        animate={{
          scale: isFocused ? 1.02 : 1,
          boxShadow: isFocused
            ? "0 0 0 3px hsl(var(--primary) / 0.3), 0 25px 50px -12px rgb(0 0 0 / 0.25)"
            : "0 10px 15px -3px rgb(0 0 0 / 0.1)",
        }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border bg-card overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b">
          <Badge className="rounded-full">문제 3</Badge>
          <Badge variant="outline" className="rounded-full text-[10px]">
            객관식
          </Badge>
          <div className="ml-auto flex items-center gap-1.5">
            <div
              className={cn(
                "size-2 rounded-full transition-colors",
                isFocused
                  ? "bg-primary animate-pulse"
                  : "bg-muted-foreground/30",
              )}
            />
            <span
              className={cn(
                "text-[10px] transition-colors",
                isFocused
                  ? "text-primary font-medium"
                  : "text-muted-foreground",
              )}
            >
              {isFocused ? "AI 분석 중" : "대기 중"}
            </span>
          </div>
        </div>

        {/* Question */}
        <div className="p-4 space-y-4">
          <p className="font-medium text-sm leading-relaxed">
            뉴턴의 운동 제2법칙 F=ma에서 질량이 2배가 되면 같은 힘에서 가속도는
            어떻게 되나요?
          </p>

          {/* Options */}
          <div className="space-y-2">
            {options.map((opt) => {
              const isSelected = selectedAnswer === opt.id;
              const showCorrect = step === "show-result" && opt.correct;

              return (
                <motion.div
                  key={opt.id}
                  id={opt.id === "B" ? BUTTON_IDS.optionB : undefined}
                  animate={{
                    scale: isSelected ? 1.02 : 1,
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all",
                    isSelected
                      ? showCorrect
                        ? "border-green-500 bg-green-500/10"
                        : "border-primary bg-primary/10"
                      : "border-muted bg-background",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      isSelected
                        ? showCorrect
                          ? "bg-green-500 text-white"
                          : "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {opt.id}
                  </span>
                  <span className="flex-1">{opt.label}</span>
                  {showCorrect && (
                    <CheckCircle2Icon className="size-5 text-green-500" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Result Footer */}
        <AnimatePresence>
          {step === "show-result" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t bg-green-500/5"
            >
              <div className="p-4 flex items-center gap-3">
                <div className="size-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2Icon className="size-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-600">
                    정답입니다!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    AI가 문제를 성공적으로 풀었습니다
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* AI Thinking Tooltip */}
      <AnimatePresence>
        {(isThinking || isSearching) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full z-20"
          >
            <div className="bg-zinc-900 text-white rounded-xl px-4 py-3 shadow-2xl min-w-[300px] max-w-[340px]">
              {/* Tooltip Arrow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                <div className="border-8 border-transparent border-t-zinc-900" />
              </div>

              {/* Web Search Section */}
              <AnimatePresence>
                {isSearching && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 pb-3 border-b border-zinc-700"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="size-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <GlobeIcon className="size-3 text-blue-400 animate-spin" />
                      </div>
                      <span className="text-xs font-medium text-zinc-300">
                        웹에서 검색 중...
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {searchResults.map((result, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.3 }}
                          className="flex items-center gap-2 text-[10px] text-zinc-400"
                        >
                          <ExternalLinkIcon className="size-3" />
                          <span className="truncate">{result.title}</span>
                          <span className="text-zinc-600 truncate">
                            {result.url}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <BrainIcon className="size-3.5 text-primary" />
                </div>
                <span className="text-xs font-medium text-zinc-300">
                  AI 사고 과정
                </span>
                <div className="ml-auto flex gap-0.5">
                  <span className="size-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="size-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="size-1 rounded-full bg-primary animate-bounce" />
                </div>
              </div>

              {/* Thinking Steps with Typewriter */}
              <div className="space-y-2">
                {thinkingSteps.map((ts, idx) => (
                  <ThinkingStepItem
                    key={idx}
                    step={ts}
                    index={idx}
                    currentIndex={thinkingIndex}
                    isActive={isThinking && idx === thinkingIndex}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cursor */}
      <SolverCursor step={step} containerRef={containerRef} />
    </div>
  );
}

function ThinkingStepItem({
  step,
  index,
  currentIndex,
  isActive,
}: {
  step: ThinkingStep;
  index: number;
  currentIndex: number;
  isActive: boolean;
}) {
  const displayText = useTypewriter(step.text, isActive, 30);
  const displayDetail = useTypewriter(
    step.detail,
    isActive && displayText === step.text,
    20,
  );

  const isCompleted = index < currentIndex;
  const isPending = index > currentIndex;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{
        opacity: isPending ? 0.3 : 1,
        x: 0,
      }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "text-xs transition-colors",
        isActive
          ? "text-white"
          : isCompleted
            ? "text-zinc-400"
            : "text-zinc-600",
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "size-1.5 rounded-full",
            isActive
              ? "bg-primary animate-pulse"
              : isCompleted
                ? "bg-green-500"
                : "bg-zinc-600",
          )}
        />
        <span className="font-medium">
          {isActive ? displayText : isCompleted ? step.text : step.text}
          {isActive && displayText !== step.text && (
            <span className="inline-block w-0.5 h-3 bg-primary ml-0.5 animate-pulse" />
          )}
        </span>
      </div>
      {(isActive || isCompleted) && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="ml-3.5 mt-1 text-zinc-400 leading-relaxed"
        >
          {isActive ? displayDetail : step.detail}
          {isActive &&
            displayText === step.text &&
            displayDetail !== step.detail && (
              <span className="inline-block w-0.5 h-3 bg-zinc-400 ml-0.5 animate-pulse" />
            )}
        </motion.p>
      )}
    </motion.div>
  );
}

function SolverCursor({
  step,
  containerRef,
}: {
  step: Step;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [pos, setPos] = useState({ x: 350, y: 250 });
  const [click, setClick] = useState(false);

  // Get element position relative to container
  const getElementPosition = (elementId: string) => {
    const element = document.getElementById(elementId);
    const container = containerRef.current;
    if (!element || !container) return null;

    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    return {
      x: elementRect.left - containerRect.left + elementRect.width / 2,
      y: elementRect.top - containerRect.top + elementRect.height / 2,
    };
  };

  useEffect(() => {
    if (step === "cursor-move-to-answer") {
      requestAnimationFrame(() => {
        const pos = getElementPosition(BUTTON_IDS.optionB);
        if (pos) setPos(pos);
      });
    } else if (step === "cursor-click-answer") {
      setClick(true);
      setTimeout(() => setClick(false), 200);
    } else if (step === "idle" || step === "complete") {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        setPos({ x: rect.width - 50, y: rect.height - 50 });
      }
    }
  }, [step, containerRef]);

  return (
    <motion.div
      animate={{ x: pos.x, y: pos.y, scale: click ? 0.9 : 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="absolute top-0 left-0 z-50 pointer-events-none drop-shadow-xl"
    >
      <MousePointer2Icon className="size-5 text-foreground fill-foreground" />
      <div
        className={cn(
          "absolute -top-1 -left-1 size-7 rounded-full bg-primary/30 animate-ping",
          click ? "block" : "hidden",
        )}
      />
    </motion.div>
  );
}
