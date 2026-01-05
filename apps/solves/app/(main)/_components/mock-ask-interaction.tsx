"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BotIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CornerDownLeftIcon,
  MousePointer2Icon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Step =
  | "idle"
  | "show-q1"
  | "cursor-move-to-option-1"
  | "cursor-click-option-1"
  | "option-1-selected"
  | "cursor-move-to-next"
  | "cursor-click-next"
  | "transition-to-q2"
  | "show-q2"
  | "cursor-move-to-option-2"
  | "cursor-click-option-2"
  | "option-2-selected"
  | "cursor-move-to-submit"
  | "cursor-click-submit"
  | "submitted"
  | "generating"
  | "show-generated"
  | "complete";

const questions = [
  {
    id: 1,
    prompt: "어떤 분야의 과학을 원하시나요?",
    options: [
      { id: "physics", label: "물리학" },
      { id: "chemistry", label: "화학" },
      { id: "biology", label: "생명과학" },
      { id: "earth", label: "지구과학" },
    ],
  },
  {
    id: 2,
    prompt: "난이도는 어느 정도로 할까요?",
    options: [
      { id: "easy", label: "쉬움 (기초)" },
      { id: "medium", label: "보통 (심화)" },
      { id: "hard", label: "어려움 (전문가)" },
    ],
  },
];

const getOptionLabel = (index: number) => String.fromCharCode(65 + index);

export function MockAskInteraction() {
  const [step, setStep] = useState<Step>("idle");
  const [currentQ, setCurrentQ] = useState(0);
  const [selections, setSelections] = useState<Record<number, string>>({});

  useEffect(() => {
    const runSimulation = async () => {
      if (step === "idle") {
        await new Promise((r) => setTimeout(r, 800));
        setStep("show-q1");
      }

      if (step === "show-q1") {
        await new Promise((r) => setTimeout(r, 1200));
        setStep("cursor-move-to-option-1");
      }

      if (step === "cursor-move-to-option-1") {
        await new Promise((r) => setTimeout(r, 700));
        setStep("cursor-click-option-1");
      }

      if (step === "cursor-click-option-1") {
        setSelections({ 0: "physics" });
        await new Promise((r) => setTimeout(r, 400));
        setStep("option-1-selected");
      }

      if (step === "option-1-selected") {
        await new Promise((r) => setTimeout(r, 800));
        setStep("cursor-move-to-next");
      }

      if (step === "cursor-move-to-next") {
        await new Promise((r) => setTimeout(r, 600));
        setStep("cursor-click-next");
      }

      if (step === "cursor-click-next") {
        await new Promise((r) => setTimeout(r, 300));
        setStep("transition-to-q2");
      }

      if (step === "transition-to-q2") {
        setCurrentQ(1);
        await new Promise((r) => setTimeout(r, 500));
        setStep("show-q2");
      }

      if (step === "show-q2") {
        await new Promise((r) => setTimeout(r, 1000));
        setStep("cursor-move-to-option-2");
      }

      if (step === "cursor-move-to-option-2") {
        await new Promise((r) => setTimeout(r, 700));
        setStep("cursor-click-option-2");
      }

      if (step === "cursor-click-option-2") {
        setSelections((prev) => ({ ...prev, 1: "medium" }));
        await new Promise((r) => setTimeout(r, 400));
        setStep("option-2-selected");
      }

      if (step === "option-2-selected") {
        await new Promise((r) => setTimeout(r, 800));
        setStep("cursor-move-to-submit");
      }

      if (step === "cursor-move-to-submit") {
        await new Promise((r) => setTimeout(r, 600));
        setStep("cursor-click-submit");
      }

      if (step === "cursor-click-submit") {
        await new Promise((r) => setTimeout(r, 300));
        setStep("submitted");
      }

      if (step === "submitted") {
        await new Promise((r) => setTimeout(r, 1500));
        setStep("generating");
      }

      if (step === "generating") {
        await new Promise((r) => setTimeout(r, 2000));
        setStep("show-generated");
      }

      if (step === "show-generated") {
        await new Promise((r) => setTimeout(r, 4000));
        setStep("complete");
      }

      if (step === "complete") {
        await new Promise((r) => setTimeout(r, 1000));
        setCurrentQ(0);
        setSelections({});
        setStep("idle");
      }
    };

    runSimulation();
  }, [step]);

  const question = questions[currentQ];
  const selected = selections[currentQ];
  const total = questions.length;
  const isFirst = currentQ === 0;
  const isLast = currentQ === total - 1;
  const progress = ((currentQ + 1) / total) * 100;

  const showOverlay =
    step === "submitted" || step === "generating" || step === "show-generated";

  return (
    <div className="w-full h-[600px] flex flex-col rounded-2xl border bg-background/95 backdrop-blur shadow-2xl overflow-hidden relative cursor-none select-none">
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

      {/* Main Content Area */}
      <div className="flex-1 p-6 flex flex-col">
        {/* User Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end mb-6"
        >
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 text-sm max-w-[80%] shadow-lg">
            과학 문제집 만들어줘
          </div>
        </motion.div>

        {/* AI Question Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 p-5 bg-muted/50 rounded-xl border flex-1 flex flex-col"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Badge className="rounded-full shrink-0 text-sm px-3 py-1">
                Q{currentQ + 1}
                <span className="opacity-60 ml-1">/{total}</span>
              </Badge>
              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentQ}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-semibold text-base block"
                  >
                    {question.prompt}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 size-9"
              title="건너뛰기"
            >
              <XIcon className="size-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-primary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Options */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col gap-3 flex-1"
            >
              {question.options.map((opt, idx) => {
                const isSelected = selected === opt.id;

                return (
                  <div
                    key={`${currentQ}-${opt.id}-${idx}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-4 text-sm transition-all cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                        : "border-muted bg-background hover:border-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-foreground/20 text-muted-foreground",
                      )}
                    >
                      {getOptionLabel(idx)}
                    </span>
                    <span className="flex-1 font-medium">{opt.label}</span>
                    {isSelected && <CheckIcon className="size-5" />}
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center gap-2 pt-2 mt-auto">
            {!isFirst && (
              <Button variant="ghost" size="default" className="gap-2">
                <ChevronLeftIcon className="size-4" />
                이전
              </Button>
            )}
            <div className="flex-1" />
            {isLast ? (
              <Button size="default" className="gap-2">
                전송
                <CornerDownLeftIcon className="size-4" />
              </Button>
            ) : (
              <Button size="default" className="gap-2">
                다음
                <ChevronRightIcon className="size-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Overlay States */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/98 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-8 z-10"
          >
            {step === "submitted" && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="size-20 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <CheckIcon className="size-10 text-primary" />
                </motion.div>
                <div className="text-center">
                  <p className="font-semibold text-xl">답변이 전송되었어요!</p>
                  <p className="text-base text-muted-foreground mt-2">
                    물리학 · 보통 난이도로 문제를 생성할게요
                  </p>
                </div>
              </>
            )}

            {step === "generating" && (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="size-20 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <SparklesIcon className="size-10 text-primary" />
                </motion.div>
                <div className="text-center">
                  <p className="font-semibold text-xl">
                    문제를 생성하고 있어요...
                  </p>
                  <p className="text-base text-muted-foreground mt-2">
                    잠시만 기다려주세요
                  </p>
                </div>
              </>
            )}

            {step === "show-generated" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md space-y-4"
              >
                <div className="flex items-center gap-2 justify-center mb-4">
                  <CheckIcon className="size-5 text-green-500" />
                  <span className="text-lg font-semibold text-green-600">
                    문제가 생성되었습니다!
                  </span>
                </div>
                <div className="rounded-2xl border bg-card p-6 space-y-4 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-full">객관식</Badge>
                    <span className="text-xs text-muted-foreground">
                      방금 생성됨
                    </span>
                  </div>
                  <p className="font-medium text-base leading-relaxed">
                    뉴턴의 운동 제2법칙 F=ma에서 질량이 2배가 되면 같은 힘에서
                    가속도는 어떻게 변하나요?
                  </p>
                  <div className="space-y-2">
                    {[
                      "2배가 된다",
                      "1/2배가 된다",
                      "변화 없다",
                      "4배가 된다",
                    ].map((opt, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
                          i === 1
                            ? "bg-primary/10 border-primary/30"
                            : "bg-muted/30 border-transparent",
                        )}
                      >
                        <span
                          className={cn(
                            "size-6 rounded-lg text-xs flex items-center justify-center font-bold",
                            i === 1
                              ? "bg-primary text-white"
                              : "bg-muted-foreground/20 text-muted-foreground",
                          )}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                  <Button size="default" className="w-full">
                    <CheckIcon className="size-4 mr-2" />
                    문제집에 추가하기
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cursor Animation */}
      <AskCursor step={step} />
    </div>
  );
}

function AskCursor({ step }: { step: Step }) {
  const [pos, setPos] = useState({ x: 500, y: 600 });
  const [click, setClick] = useState(false);

  useEffect(() => {
    if (step === "cursor-move-to-option-1") {
      setPos({ x: 250, y: 280 }); // First option (물리학)
    } else if (step === "cursor-click-option-1") {
      setClick(true);
      setTimeout(() => setClick(false), 200);
    } else if (step === "cursor-move-to-next") {
      setPos({ x: 450, y: 530 }); // Next button
    } else if (step === "cursor-click-next") {
      setClick(true);
      setTimeout(() => setClick(false), 200);
    } else if (step === "cursor-move-to-option-2") {
      setPos({ x: 250, y: 350 }); // Second option (보통)
    } else if (step === "cursor-click-option-2") {
      setClick(true);
      setTimeout(() => setClick(false), 200);
    } else if (step === "cursor-move-to-submit") {
      setPos({ x: 450, y: 530 }); // Submit button
    } else if (step === "cursor-click-submit") {
      setClick(true);
      setTimeout(() => setClick(false), 200);
    } else if (step === "idle" || step === "complete") {
      setPos({ x: 500, y: 600 });
    }
  }, [step]);

  return (
    <motion.div
      animate={{ x: pos.x, y: pos.y, scale: click ? 0.9 : 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="absolute top-0 left-0 z-50 pointer-events-none drop-shadow-xl"
    >
      <MousePointer2Icon className="size-6 text-foreground fill-foreground" />
      <div
        className={cn(
          "absolute -top-1 -left-1 size-8 rounded-full bg-primary/30 animate-ping",
          click ? "block" : "hidden",
        )}
      />
    </motion.div>
  );
}
