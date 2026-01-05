"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  MousePointer2Icon,
  SparklesIcon,
  TrophyIcon,
  UserIcon,
  XCircleIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Step =
  | "idle"
  | "show-question"
  | "cursor-move-to-option"
  | "cursor-click-option"
  | "show-correct-feedback"
  | "cursor-move-to-next"
  | "cursor-click-next"
  | "transition-to-q2"
  | "show-q2"
  | "cursor-move-to-wrong"
  | "cursor-click-wrong"
  | "show-wrong-feedback"
  | "show-final-score"
  | "complete";

const questions = [
  {
    id: 1,
    question: "대한민국의 수도는?",
    options: [
      { id: "A", label: "부산" },
      { id: "B", label: "서울" },
      { id: "C", label: "인천" },
      { id: "D", label: "대전" },
    ],
    correctAnswer: "B",
  },
  {
    id: 2,
    question: "1 + 1 = ?",
    options: [
      { id: "A", label: "1" },
      { id: "B", label: "3" },
      { id: "C", label: "2" },
      { id: "D", label: "4" },
    ],
    correctAnswer: "C",
  },
];

export function MockUserSolver() {
  const [step, setStep] = useState<Step>("idle");
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<"correct" | "wrong" | null>(
    null,
  );
  const [score, setScore] = useState(0);

  useEffect(() => {
    const runSimulation = async () => {
      if (step === "idle") {
        await new Promise((r) => setTimeout(r, 800));
        setStep("show-question");
      }

      if (step === "show-question") {
        await new Promise((r) => setTimeout(r, 1000));
        setStep("cursor-move-to-option");
      }

      if (step === "cursor-move-to-option") {
        await new Promise((r) => setTimeout(r, 800));
        setStep("cursor-click-option");
      }

      if (step === "cursor-click-option") {
        setSelectedAnswer("B");
        await new Promise((r) => setTimeout(r, 400));
        setStep("show-correct-feedback");
      }

      if (step === "show-correct-feedback") {
        setShowFeedback("correct");
        setScore(1);
        await new Promise((r) => setTimeout(r, 1500));
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
        setSelectedAnswer(null);
        setShowFeedback(null);
        await new Promise((r) => setTimeout(r, 500));
        setStep("show-q2");
      }

      if (step === "show-q2") {
        await new Promise((r) => setTimeout(r, 1000));
        setStep("cursor-move-to-wrong");
      }

      if (step === "cursor-move-to-wrong") {
        await new Promise((r) => setTimeout(r, 800));
        setStep("cursor-click-wrong");
      }

      if (step === "cursor-click-wrong") {
        setSelectedAnswer("B"); // Wrong answer
        await new Promise((r) => setTimeout(r, 400));
        setStep("show-wrong-feedback");
      }

      if (step === "show-wrong-feedback") {
        setShowFeedback("wrong");
        await new Promise((r) => setTimeout(r, 1500));
        setStep("show-final-score");
      }

      if (step === "show-final-score") {
        await new Promise((r) => setTimeout(r, 3500));
        setStep("complete");
      }

      if (step === "complete") {
        await new Promise((r) => setTimeout(r, 1000));
        setCurrentQ(0);
        setSelectedAnswer(null);
        setShowFeedback(null);
        setScore(0);
        setStep("idle");
      }
    };

    runSimulation();
  }, [step]);

  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
    <div className="w-full h-[600px] flex flex-col rounded-2xl border bg-background/95 backdrop-blur shadow-2xl overflow-hidden relative cursor-none select-none">
      {/* Header */}
      <div className="h-14 border-b flex items-center px-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 gap-3 shrink-0">
        <div className="flex gap-1.5">
          <div className="size-3 rounded-full bg-red-400/80" />
          <div className="size-3 rounded-full bg-amber-400/80" />
          <div className="size-3 rounded-full bg-green-400/80" />
        </div>
        <div className="h-6 w-[1px] bg-border mx-2" />
        <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
          <UserIcon className="size-3.5" />
          문제 풀이
        </div>
        <Badge className="rounded-full bg-green-500 hover:bg-green-500 ml-auto">
          Q{currentQ + 1}/{questions.length}
        </Badge>
        <div className="flex items-center gap-1.5 text-sm">
          <TrophyIcon className="size-4 text-amber-500" />
          <span className="font-bold">{score}</span>
          <span className="text-muted-foreground">/ {questions.length}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-muted shrink-0">
        <motion.div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question Area */}
      <div className="flex-1 p-6 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 flex-1 flex flex-col"
          >
            {/* Question Text */}
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">
                상식 퀴즈
              </Badge>
              <p className="font-bold text-xl leading-relaxed">
                {question.question}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 flex-1">
              {question.options.map((opt) => {
                const isSelected = selectedAnswer === opt.id;
                const isCorrect = opt.id === question.correctAnswer;
                const showCorrectHighlight = showFeedback && isCorrect;
                const showWrongHighlight =
                  showFeedback === "wrong" && isSelected && !isCorrect;

                return (
                  <motion.div
                    key={opt.id}
                    animate={{
                      scale: isSelected ? 1.02 : 1,
                    }}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border px-5 py-4 text-base transition-all",
                      showCorrectHighlight
                        ? "border-green-500 bg-green-500/10"
                        : showWrongHighlight
                          ? "border-red-500 bg-red-500/10"
                          : isSelected
                            ? "border-primary bg-primary/10"
                            : "border-muted bg-background hover:border-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors",
                        showCorrectHighlight
                          ? "bg-green-500 text-white"
                          : showWrongHighlight
                            ? "bg-red-500 text-white"
                            : isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                      )}
                    >
                      {opt.id}
                    </span>
                    <span className="flex-1 font-medium">{opt.label}</span>
                    {showCorrectHighlight && (
                      <CheckCircle2Icon className="size-6 text-green-500" />
                    )}
                    {showWrongHighlight && (
                      <XCircleIcon className="size-6 text-red-500" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Feedback Message */}
            <div className="h-14">
              <AnimatePresence>
                {showFeedback && step !== "show-final-score" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl text-base font-medium",
                      showFeedback === "correct"
                        ? "bg-green-500/10 text-green-600"
                        : "bg-red-500/10 text-red-600",
                    )}
                  >
                    {showFeedback === "correct" ? (
                      <>
                        <CheckCircle2Icon className="size-5" />
                        정답입니다! 🎉
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="size-5" />
                        틀렸어요. 정답은 {question.correctAnswer}번입니다.
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex justify-end">
              <Button size="lg" className="gap-2">
                다음 문제
                <ChevronRightIcon className="size-5" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Final Score Overlay */}
      <AnimatePresence>
        {step === "show-final-score" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/98 backdrop-blur-sm flex flex-col items-center justify-center gap-6 p-8 z-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="size-28 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg"
            >
              <TrophyIcon className="size-14 text-white" />
            </motion.div>
            <div className="text-center">
              <p className="text-3xl font-bold">풀이 완료!</p>
              <p className="text-lg text-muted-foreground mt-2">
                {score}/{questions.length} 문제 정답
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[...Array(questions.length)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <SparklesIcon
                    className={cn(
                      "size-8",
                      i < score ? "text-amber-500" : "text-muted-foreground/30",
                    )}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cursor */}
      <UserSolverCursor step={step} />
    </div>
  );
}

function UserSolverCursor({ step }: { step: Step }) {
  const [pos, setPos] = useState({ x: 500, y: 600 });
  const [click, setClick] = useState(false);

  useEffect(() => {
    if (step === "cursor-move-to-option") {
      setPos({ x: 280, y: 260 }); // Option B (서울)
    } else if (step === "cursor-click-option") {
      setClick(true);
      setTimeout(() => setClick(false), 200);
    } else if (step === "cursor-move-to-next") {
      setPos({ x: 450, y: 540 }); // Next button
    } else if (step === "cursor-click-next") {
      setClick(true);
      setTimeout(() => setClick(false), 200);
    } else if (step === "cursor-move-to-wrong") {
      setPos({ x: 280, y: 260 }); // Option B (wrong)
    } else if (step === "cursor-click-wrong") {
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
          "absolute -top-1 -left-1 size-8 rounded-full bg-green-500/30 animate-ping",
          click ? "block" : "hidden",
        )}
      />
    </motion.div>
  );
}
