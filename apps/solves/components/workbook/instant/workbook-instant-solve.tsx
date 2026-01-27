"use client";

import {
  BlockAnswerSubmit,
  ChatModel,
  checkAnswer,
  initialSubmitAnswer,
  WorkBookBlock,
} from "@service/solves/shared";
import { applyStateUpdate, StateUpdate } from "@workspace/util";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { generateBlockByPlanAction } from "@/actions/workbook-ai";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { notify } from "@/components/ui/notify";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Block } from "@/components/workbook/block/block";
import { useToRef } from "@/hooks/use-to-ref";
import { WorkbookPlan } from "@/lib/ai/tools/workbook/workbook-plan";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";

interface WorkbookInstantSolveProps {
  workbookPlan: WorkbookPlan;
  categoryId: number;
  model: ChatModel;
  onRestart: () => void;
}

export function WorkbookInstantSolve({
  workbookPlan,
  categoryId,
  model,
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

  const progressValue = useMemo(() => {
    return totalCount > 0 ? ((currentIndex + 1) / totalCount) * 100 : 0;
  }, [totalCount, currentIndex]);

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
    setIsCompleted(true);
  }, []);

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

  if (isCompleted) {
    return (
      <div className="w-full space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setIsCompleted(false);
              setCurrentIndex(0);
              setSubmits({});
            }}
          >
            다시 풀기
          </Button>
          <Button variant="secondary" onClick={handleSave}>
            문제집 저장
          </Button>
          <Button onClick={onRestart}>다른 문제집 만들기</Button>
        </div>
        <div className="space-y-6 py-12">
          {submitBlocks.map((submitBlock, index) => {
            // 해당 블록의 결과 찾기

            return (
              <Block
                className={cn(
                  "fade-2000",
                  !submitBlock.submit.isCorrect
                    ? false
                    : true
                      ? "bg-muted-foreground/5"
                      : "",
                )}
                index={index}
                key={submitBlock.block.id}
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
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{workbookPlan.overview.title}</h1>
          <Badge className="rounded-full text-xs">Instant</Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {workbookPlan.overview.description}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          문제 {Math.min(currentIndex + 1, totalCount)} / {totalCount}
        </span>
        <span className="text-xs text-muted-foreground">
          {Math.round(progressValue)}%
        </span>
      </div>
      <Progress
        value={progressValue}
        indicatorColor="var(--primary)"
        className="h-2 bg-muted/60"
      />

      {error ? (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="space-y-2 text-center py-8">
            <h4>문제 생성 중 오류가 발생했습니다.</h4>
            <p className="text-sm text-muted-foreground">
              {error || "문제를 생성할 수 없습니다."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="lg"
              onClick={onRestart}
              disabled={isGenerating}
              variant="ghost"
            >
              처음으로
            </Button>
            <Button
              size="lg"
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
      ) : currentBlock ? (
        <>
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
          <div className="flex items-center gap-2">
            {currentIndex > 0 && (
              <Button
                onClick={handlePrevious}
                variant="ghost"
                size="lg"
                disabled={isGenerating}
              >
                이전
              </Button>
            )}
            {isLast ? (
              <Button
                className="ml-auto"
                size="lg"
                onClick={handleComplete}
                disabled={isGenerating}
              >
                풀이 완료
              </Button>
            ) : (
              <Button
                className="ml-auto"
                size="lg"
                onClick={handleNext}
                disabled={isGenerating || !currentBlock}
              >
                다음
              </Button>
            )}
          </div>
        </>
      ) : !currentBlock && !isGenerating ? (
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
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}
    </div>
  );
}
