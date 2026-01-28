"use client";

import {
  BlockAnswerSubmit,
  blockDisplayNames,
  ChatModel,
  checkAnswer,
  initialSubmitAnswer,
  WorkBookBlock,
} from "@service/solves/shared";
import { applyStateUpdate, StateUpdate } from "@workspace/util";
import { motion } from "framer-motion";
import {
  CheckIcon,
  ClockIcon,
  LoaderIcon,
  TimerIcon,
  XIcon,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { generateBlockByPlanAction } from "@/actions/workbook-ai";
import { ModelDropDownMenu } from "@/components/chat/model-drop-down-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GradualSpacingText } from "@/components/ui/gradual-spacing-text";
import { ModelProviderIcon } from "@/components/ui/model-provider-icon";
import { notify } from "@/components/ui/notify";
import { Skeleton } from "@/components/ui/skeleton";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { Block } from "@/components/workbook/block/block";
import { useToRef } from "@/hooks/use-to-ref";
import { BlockPlan, WorkbookPlan } from "@/lib/ai/tools/workbook/workbook-plan";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";

interface WorkbookInstantSolveProps {
  workbookPlan: WorkbookPlan;
  categoryId: number;
  model: ChatModel;
  onModelChange?: (model: ChatModel) => void;
  onRestart: () => void;
}

export function WorkbookInstantSolve({
  workbookPlan,
  categoryId,
  model,
  onModelChange,
  onRestart,
}: WorkbookInstantSolveProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const totalCount = workbookPlan.blockPlans.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [blocks, setBlocks] = useState<(WorkBookBlock | undefined)[]>(() => {
    return workbookPlan.blockPlans.map(() => undefined);
  });
  const [submits, setSubmits] = useState<Record<string, BlockAnswerSubmit>>({});
  const [error, setError] = useState<string | null>(null);

  // Timer states
  const [timers, setTimers] = useState<Record<number, number>>({});
  const [currentBlockStartTime, setCurrentBlockStartTime] = useState<number>(
    Date.now(),
  );
  const [currentElapsed, setCurrentElapsed] = useState<number>(0);

  const isLast = totalCount > 0 && currentIndex === totalCount - 1;

  const latestRef = useToRef({
    currentIndex,
  });

  const submitBlocks = useMemo(() => {
    return (blocks.filter(Boolean) as WorkBookBlock[]).map((block) => {
      const submit = submits[block.id];
      const isCorrect = checkAnswer(block.answer, submit);
      return {
        block,
        submit: {
          blockId: block.id,
          isCorrect,
          submit: submit,
        },
      };
    });
  }, [blocks, submits]);

  const currentBlockPlan = useMemo(() => {
    return workbookPlan.blockPlans[currentIndex];
  }, [currentIndex, workbookPlan]);

  const currentBlock = useMemo(() => {
    return blocks[currentIndex];
  }, [blocks, currentIndex]);

  const totalElapsedTime = useMemo(() => {
    const savedTime = Object.values(timers).reduce(
      (sum, time) => sum + time,
      0,
    );
    return savedTime + currentElapsed;
  }, [timers, currentElapsed]);

  const [, generateBlock, isGenerating] = useSafeAction(
    generateBlockByPlanAction,
    {
      onSuccess: (result) => {
        setBlocks((prev) => {
          const nextBlocks = [...prev];
          nextBlocks[latestRef.current.currentIndex] = result.block;
          return nextBlocks;
        });
      },
      onError: (error) => setError(error.message),
    },
  );

  const handleUpdateSubmitAnswer = useCallback(
    (id: string, answer: StateUpdate<BlockAnswerSubmit>) => {
      setSubmits((prev) => {
        const nextSubmits = { ...prev };
        const block = blocks.find((b) => b?.id === id);
        if (!block) return prev;
        nextSubmits[id] = applyStateUpdate(
          { ...initialSubmitAnswer(block.type), ...nextSubmits[id] },
          answer,
        );
        return nextSubmits;
      });
    },
    [blocks],
  );

  const handleNext = useCallback(() => {
    const nextIndex = Math.min(currentIndex + 1, totalCount - 1);
    const nextBlockPlan = workbookPlan.blockPlans[nextIndex];
    const nextBlock = blocks[nextIndex];

    if (!nextBlockPlan) return toast.error("다음 문제를 생성할 수 없습니다.");
    if (!nextBlock) {
      generateBlock({
        plan: workbookPlan,
        blockPlan: nextBlockPlan,
        categoryId,
        model,
      });
    }
    setCurrentIndex(nextIndex);
  }, [
    totalCount,
    currentIndex,
    workbookPlan,
    categoryId,
    model,
    blocks,
    generateBlock,
  ]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleComplete = useCallback(() => {
    // Save current problem's timer before completing
    setTimers((prev) => ({
      ...prev,
      [currentIndex]: Math.floor((Date.now() - currentBlockStartTime) / 1000),
    }));
    setIsCompleted(true);
  }, [currentIndex, currentBlockStartTime]);

  const handleSave = useCallback(async () => {
    await notify.alert({
      title: "준비중",
      description: "문제집 저장 기능은 곧 추가할게요.",
    });
  }, []);

  useEffect(() => {
    if (!currentBlockPlan) return;
    generateBlock({
      plan: workbookPlan,
      blockPlan: currentBlockPlan,
      categoryId,
      model,
    });
  }, []);

  // Timer effect - update current elapsed time every second
  useEffect(() => {
    // Stop timer when completed
    if (isCompleted) return;

    const interval = setInterval(() => {
      setCurrentElapsed(
        Math.floor((Date.now() - currentBlockStartTime) / 1000),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [currentBlockStartTime, isCompleted]);

  // Save timer when moving to next/previous problem
  useEffect(() => {
    return () => {
      setTimers((prev) => ({
        ...prev,
        [currentIndex]: Math.floor((Date.now() - currentBlockStartTime) / 1000),
      }));
    };
  }, [currentIndex]);

  // Reset timer when currentIndex changes
  useEffect(() => {
    if (timers[currentIndex] !== undefined) {
      setCurrentElapsed(timers[currentIndex]);
    } else {
      setCurrentBlockStartTime(Date.now());
      setCurrentElapsed(0);
    }
  }, [currentIndex]);

  if (isCompleted) {
    return (
      <div className="w-full space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="px-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <ClockIcon className="size-4 text-muted-foreground" />
                <span className="font-semibold tabular-nums">
                  {formatTime(totalElapsedTime)}
                </span>
                <span className="text-muted-foreground">총 소요 시간</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="shadow-none"
              onClick={() => {
                setIsCompleted(false);
                setCurrentIndex(0);
                setSubmits({});
              }}
            >
              다시 풀기
            </Button>
            <Button
              variant="secondary"
              onClick={handleSave}
              className="shadow-none bg-input"
            >
              문제집 저장
            </Button>
            <Button onClick={onRestart}>다른 문제집 만들기</Button>
          </div>
        </div>
        <div className="space-y-6 py-6">
          {submitBlocks.map((submitBlock, index) => {
            const blockTime = timers[index] ?? 0;

            return (
              <div key={submitBlock.block.id} className="space-y-2">
                <div className="flex items-center justify-end gap-2 p-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TimerIcon className="size-3.5" />
                    <span className="tabular-nums">
                      {formatTime(blockTime)}
                    </span>
                  </div>
                </div>
                <Block
                  className={cn(
                    "fade-2000",
                    submitBlock.submit.isCorrect && "bg-muted-foreground/5",
                  )}
                  index={index}
                  id={submitBlock.block.id}
                  question={submitBlock.block.question}
                  order={submitBlock.block.order}
                  type={submitBlock.block.type}
                  content={submitBlock.block.content}
                  isCorrect={submitBlock.submit.isCorrect}
                  answer={submitBlock.block.answer}
                  submit={submitBlock.submit.submit}
                  mode="review"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="fade-2000 text-base sm:text-2xl font-bold">
            {workbookPlan.overview.title}
          </h1>
          <Badge className="rounded-full text-xs">Beta</Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
          <GradualSpacingText text={workbookPlan.overview.description} />
        </p>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="space-y-2 text-center py-8">
            <h4>문제 생성 중 오류가 발생했습니다.</h4>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="lg"
              className="shadow-none bg-input"
              onClick={onRestart}
              disabled={isGenerating}
              variant="ghost"
            >
              처음으로
            </Button>
            <Button
              size="lg"
              className="shadow-none bg-input"
              onClick={() => {
                setError(null);
                generateBlock({
                  plan: workbookPlan,
                  blockPlan: currentBlockPlan,
                  categoryId,
                  model,
                });
              }}
              disabled={isGenerating}
              variant="secondary"
            >
              문제 다시 생성
            </Button>
          </div>
        </div>
      ) : (
        <>
          <BlockPlanHeader
            model={model}
            onModelChange={onModelChange}
            workbookPlan={workbookPlan}
            currentIndex={currentIndex}
            blocks={blocks}
            currentElapsed={currentElapsed}
            isGenerating={isGenerating}
            submits={submits}
          />
          {currentBlock ? (
            <>
              <div className="fade-2000" key={currentBlock.id}>
                <Block
                  id={currentBlock.id}
                  question={currentBlock.question}
                  index={currentIndex}
                  order={currentBlock.order}
                  type={currentBlock.type}
                  content={currentBlock.content}
                  mode="solve"
                  submit={submits[currentBlock.id]}
                  onUpdateSubmitAnswer={handleUpdateSubmitAnswer.bind(
                    null,
                    currentBlock.id,
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {currentIndex > 0 ? (
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    size="lg"
                    disabled={isGenerating}
                    className="text-base font-semibold"
                  >
                    이전
                  </Button>
                ) : (
                  <div />
                )}
                {isLast ? (
                  <Button
                    size="lg"
                    onClick={handleComplete}
                    disabled={isGenerating}
                    className="text-base font-semibold col-start-2"
                  >
                    풀이 완료
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={handleNext}
                    disabled={isGenerating || !currentBlock}
                    className="text-base font-semibold col-start-2"
                  >
                    다음
                  </Button>
                )}
              </div>
            </>
          ) : !isGenerating ? (
            <div className="space-y-3">
              <Button
                size="lg"
                onClick={() => {
                  if (!currentBlockPlan)
                    return toast.error("문제를 생성할 수 없습니다.");
                  generateBlock({
                    plan: workbookPlan,
                    blockPlan: currentBlockPlan,
                    categoryId,
                    model,
                  });
                }}
              >
                문제 생성
              </Button>
            </div>
          ) : (
            <BlockGenerationLoading blockPlan={currentBlockPlan} />
          )}
        </>
      )}
    </div>
  );
}

// Helper function to format time
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// BlockPlanHeader component - shows current problem context
interface BlockPlanHeaderProps {
  workbookPlan: WorkbookPlan;
  currentIndex: number;
  blocks: (WorkBookBlock | undefined)[];
  currentElapsed: number;
  isGenerating?: boolean;
  model: ChatModel;
  onModelChange?: (model: ChatModel) => void;
  submits: Record<string, BlockAnswerSubmit>;
}

function BlockPlanHeader({
  workbookPlan,
  currentIndex,
  blocks,
  model,
  onModelChange,
  currentElapsed,
  isGenerating = false,
  submits,
}: BlockPlanHeaderProps) {
  const currentBlockPlan = workbookPlan.blockPlans[currentIndex];
  const totalCount = workbookPlan.blockPlans.length;

  const difficultyLabel = {
    easy: "쉬움",
    medium: "보통",
    hard: "어려움",
  } as const;

  return (
    <div className="space-y-6">
      {/* Problem step indicator */}
      <div className="items-center justify-center gap-2 py-4 hidden sm:flex flex-wrap max-w-4xl mx-auto">
        {workbookPlan.blockPlans.map((_, index) => {
          const block = blocks[index];
          const isCurrent = index === currentIndex;
          const hasBlock = block !== undefined;
          const hasSubmit = hasBlock && block && submits[block.id];

          // Check if answer is correct (only if submitted)
          let isCorrect: boolean | undefined;
          if (hasSubmit) {
            isCorrect = checkAnswer(block.answer, submits[block.id]);
          }

          // Completed means: passed this problem AND submitted answer
          const isCompleted = hasSubmit && index < currentIndex;

          // Determine icon and style
          const showLoader = isCurrent && isGenerating;
          const showCheck = isCompleted && isCorrect;
          const showX = isCompleted && isCorrect === false;
          const isSkipped = hasBlock && index < currentIndex && !hasSubmit;

          return (
            <Fragment key={index}>
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "relative rounded-full flex items-center justify-center font-bold shrink-0 size-8 text-sm",
                  isCurrent
                    ? "bg-input text-foreground ring-1 ring-muted-foreground/20 animate-pulse"
                    : isCompleted && isCorrect
                      ? "bg-primary/80 text-primary-foreground shadow-md"
                      : isCompleted && isCorrect === false
                        ? "bg-destructive/80 text-destructive-foreground shadow-md"
                        : isSkipped
                          ? "bg-muted/50 text-muted-foreground/50 opacity-60"
                          : hasBlock
                            ? "bg-muted text-muted-foreground"
                            : "bg-input dark:bg-muted text-muted-foreground",
                )}
              >
                {showLoader ? (
                  <LoaderIcon className="size-4 animate-spin" />
                ) : showCheck ? (
                  <CheckIcon className="size-5" />
                ) : showX ? (
                  <XIcon className="size-5" />
                ) : (
                  <span className={cn(isSkipped && "line-through")}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                )}
              </motion.div>
              {index < totalCount - 1 && (
                <div className="h-1 w-8 md:w-12 bg-input dark:bg-muted relative overflow-hidden rounded-full shrink-0">
                  <motion.div
                    initial={false}
                    animate={{
                      x: isCompleted || isSkipped ? "0%" : "-100%",
                    }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "h-full w-full",
                      isSkipped
                        ? "bg-muted-foreground/30"
                        : isCorrect
                          ? "bg-primary"
                          : isCorrect === false
                            ? "bg-destructive"
                            : "bg-primary",
                    )}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      {/* Current problem info */}
      <div
        key={currentIndex}
        className="rounded-lg bg-background dark:bg-muted/40 p-4 space-y-2 fade-2000"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-muted-foreground tabular-nums">
                {String(currentIndex + 1).padStart(2, "0")}
              </span>
              <h3 className="text-base font-semibold truncate">
                {currentBlockPlan.topic}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {currentBlockPlan.learningObjective}
            </p>
          </div>
          <div className="items-center gap-2 shrink-0 hidden sm:flex">
            <Badge variant="secondary" className="text-xs shadow-none bg-input">
              {difficultyLabel[currentBlockPlan.expectedDifficulty ?? "medium"]}
            </Badge>
            <Badge variant="secondary" className="text-xs shadow-none bg-input">
              {blockDisplayNames[currentBlockPlan.type]}
            </Badge>
          </div>
        </div>
        {/* Timer */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
          <TimerIcon className="size-3.5" />
          <span className="tabular-nums font-medium">
            {formatTime(currentElapsed)}
          </span>

          <div className="ml-auto">
            <ModelDropDownMenu
              defaultModel={model}
              onModelChange={onModelChange}
              align="end"
            >
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <ModelProviderIcon
                  provider={model.provider}
                  className="size-3.5"
                />
                <span>{model.displayName || model.model}</span>
              </button>
            </ModelDropDownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}

// BlockGenerationLoading component - simple skeleton animation
interface BlockGenerationLoadingProps {
  blockPlan?: BlockPlan;
  elapsedSeconds?: number;
}

function BlockGenerationLoading({ blockPlan }: BlockGenerationLoadingProps) {
  if (!blockPlan) return null;

  return (
    <div className="space-y-6">
      {/* Generation Status */}
      <div className="space-y-2">
        <TextShimmer className="text-sm">문제를 생성하고 있어요</TextShimmer>
      </div>

      {/* Simple Skeleton Animation - Bigger and Less */}
      <div className="space-y-6">
        {/* Question */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <Skeleton className="h-8 w-full rounded-lg bg-input" />
          <Skeleton className="h-8 w-4/5 rounded-lg bg-input" />
        </motion.div>

        {/* Answer Options based on type */}
        {blockPlan.type === "mcq" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="space-y-3"
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
              >
                <Skeleton className="h-14 w-full rounded-lg bg-input" />
              </motion.div>
            ))}
          </motion.div>
        ) : blockPlan.type === "ox" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            <Skeleton className="h-40 w-full rounded-lg bg-input" />
            <Skeleton className="h-40 w-full rounded-lg bg-input" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Skeleton className="h-32 w-full rounded-lg bg-input" />
          </motion.div>
        )}
      </div>
    </div>
  );
}
