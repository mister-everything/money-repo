"use client";

import {
  BlockAnswerSubmit,
  BlockType,
  blockDisplayNames,
  checkAnswer,
  initialSubmitAnswer,
  serializeSummaryBlock,
  WorkBook,
  WorkBookBlock,
  WorkBookReviewSession,
} from "@service/solves/shared";
import {
  applyStateUpdate,
  errorToString,
  generateUUID,
  StateUpdate,
} from "@workspace/util";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { notify } from "@/components/ui/notify";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Block } from "@/components/workbook/block/block";
import { WorkBookReview } from "@/components/workbook/workbook-review";
import { useChatModelList } from "@/hooks/query/use-chat-model-list";
import {
  mcqMultipleToolInputToBlock,
  mcqToolInputToBlock,
  oxToolInputToBlock,
  rankingToolInputToBlock,
  subjectiveToolInputToBlock,
} from "@/lib/ai/tools/workbook/shared";
import { fetcher } from "@/lib/protocol/fetcher";
import { useAiStore } from "@/store/ai-store";
import {
  getInstantSolvePlanKey,
  useInstantSolveStore,
} from "@/store/instant-solve-store";
import { useWorkbookEditStore } from "@/store/workbook-edit-store";

export function WorkbookInstantSolve() {
  useChatModelList();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { chatModel } = useAiStore();
  const workbookPlan = useWorkbookEditStore((state) => state.workbookPlan);
  const { sessions, saveSession, hasHydrated } = useInstantSolveStore();

  const categoryId = useMemo(() => {
    const value = Number(searchParams.get("categoryId") ?? 0);
    return Number.isFinite(value) ? value : 0;
  }, [searchParams]);
  const planKey = useMemo(() => {
    if (!workbookPlan || categoryId <= 0) return null;
    return getInstantSolvePlanKey(workbookPlan, categoryId);
  }, [workbookPlan, categoryId]);
  const storedSession = planKey ? sessions[planKey] : undefined;

  const totalCount = workbookPlan?.blockPlans.length ?? 0;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [blocks, setBlocks] = useState<(WorkBookBlock | undefined)[]>([]);
  const [submits, setSubmits] = useState<Record<string, BlockAnswerSubmit>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [isRestored, setIsRestored] = useState(false);

  const blocksRef = useRef<(WorkBookBlock | undefined)[]>([]);
  const isGeneratingRef = useRef(false);
  const startTimeRef = useRef<Date>(new Date());
  const instantWorkbookId = useMemo(() => generateUUID(), []);
  const restoredKeyRef = useRef<string | null>(null);
  const inFlightRef = useRef<{
    planKey: string;
    index: number;
    requestId: string;
  } | null>(null);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  useEffect(() => {
    setIsRestored(false);
  }, [planKey]);

  useEffect(() => {
    if (!hasHydrated || !planKey) return;
    if (restoredKeyRef.current === planKey) {
      setIsRestored(true);
      return;
    }
    const session = storedSession;
    if (!session) {
      setBlocks([]);
      setSubmits({});
      setCurrentIndex(0);
      setIsCompleted(false);
      setCompletedAt(null);
      restoredKeyRef.current = planKey;
      setIsRestored(true);
      return;
    }

    const restoredBlocks = session.blocks ?? [];
    const nextIndex = Math.max(
      0,
      Math.min(
        session.currentIndex ?? 0,
        Math.max(restoredBlocks.length - 1, 0),
      ),
    );
    const hasCompleted =
      Boolean(session.completedAt) &&
      restoredBlocks.length >= (workbookPlan?.blockPlans.length ?? 0);

    setBlocks(restoredBlocks);
    setSubmits(session.submits ?? {});
    setCurrentIndex(nextIndex);
    setIsCompleted(hasCompleted);
    setCompletedAt(session.completedAt ? new Date(session.completedAt) : null);
    restoredKeyRef.current = planKey;
    setIsRestored(true);
  }, [hasHydrated, planKey, storedSession, workbookPlan?.blockPlans.length]);

  useEffect(() => {
    if (!hasHydrated || !planKey || !workbookPlan || categoryId <= 0) return;
    if (!isRestored) return;
    const persistedBlocks = blocks.filter(Boolean) as WorkBookBlock[];
    saveSession({
      planKey,
      categoryId,
      currentIndex: Math.max(
        0,
        Math.min(currentIndex, Math.max(persistedBlocks.length - 1, 0)),
      ),
      blocks: persistedBlocks,
      submits,
      completedAt:
        isCompleted && completedAt ? completedAt.toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });
  }, [
    blocks,
    categoryId,
    completedAt,
    currentIndex,
    hasHydrated,
    isCompleted,
    isRestored,
    planKey,
    saveSession,
    submits,
    workbookPlan,
  ]);

  const currentBlock = blocks[currentIndex];
  const currentPlanType = workbookPlan?.blockPlans[currentIndex]?.type as
    | BlockType
    | undefined;

  const reviewSession = useMemo<WorkBookReviewSession | undefined>(() => {
    if (!workbookPlan || categoryId <= 0) return undefined;
    const solvedBlocks = blocks.filter(Boolean) as WorkBookBlock[];
    if (solvedBlocks.length === 0) return undefined;

    const submitAnswers = solvedBlocks.map((block) => {
      const submit = submits[block.id];
      const isCorrect = checkAnswer(block.answer, submit);
      return {
        blockId: block.id,
        isCorrect,
        submit,
      };
    });

    const correctBlocks = submitAnswers.filter((v) => v.isCorrect).length;
    const totalBlocks = workbookPlan.blockPlans.length;

    const workBook: WorkBook = {
      id: instantWorkbookId,
      title: workbookPlan.overview.title,
      likeCount: 0,
      description: workbookPlan.overview.description,
      blocks: solvedBlocks,
      tags: [],
      isPublic: false,
      ownerPublicId: 0,
      createdAt: completedAt ?? new Date(),
      categoryId,
    };

    return {
      workBook,
      isLiked: false,
      session: {
        status: "submitted",
        startTime: startTimeRef.current,
        submitId: instantWorkbookId,
        endTime: completedAt ?? new Date(),
        totalBlocks,
        correctBlocks,
      },
      submitAnswers,
    };
  }, [
    blocks,
    categoryId,
    completedAt,
    instantWorkbookId,
    submits,
    workbookPlan,
  ]);

  const canGenerate = Boolean(
    workbookPlan && chatModel && categoryId > 0 && hasHydrated && isRestored,
  );
  const isLast = totalCount > 0 && currentIndex === totalCount - 1;
  const progressValue =
    totalCount > 0 ? ((currentIndex + 1) / totalCount) * 100 : 0;

  const createBlockFromToolInput = useCallback(
    (type: BlockType, input: unknown, order: number) => {
      const id = generateUUID();
      const block =
        type === "mcq"
          ? mcqToolInputToBlock({ id, input: input as any })
          : type === "mcq-multiple"
            ? mcqMultipleToolInputToBlock({ id, input: input as any })
            : type === "ranking"
              ? rankingToolInputToBlock({ id, input: input as any })
              : type === "ox"
                ? oxToolInputToBlock({ id, input: input as any })
                : subjectiveToolInputToBlock({ id, input: input as any });

      return { ...block, order };
    },
    [],
  );

  const generateBlock = useCallback(
    async (index: number) => {
      if (!workbookPlan || !chatModel || categoryId <= 0 || !planKey) return;
      if (isGeneratingRef.current) return;
      if (blocksRef.current[index]) return;
      const blockPlan = workbookPlan.blockPlans[index];
      if (!blockPlan) return;

      const requestId = generateUUID();
      inFlightRef.current = { planKey, index, requestId };
      setIsGenerating(true);
      setError(null);
      isGeneratingRef.current = true;
      try {
        const previousBlocks = blocksRef.current
          .filter(Boolean)
          .map((block) => JSON.stringify(serializeSummaryBlock(block!)));

        const input = await fetcher<unknown>("/api/workbooks/instant", {
          method: "POST",
          body: JSON.stringify({
            overview: workbookPlan.overview,
            constraints: workbookPlan.constraints ?? [],
            guidelines: workbookPlan.guidelines ?? [],
            blockPlan,
            categoryId,
            previousBlocks,
            model: chatModel,
          }),
        });

        if (
          !inFlightRef.current ||
          inFlightRef.current.requestId !== requestId
        ) {
          return;
        }

        const nextBlock = createBlockFromToolInput(
          blockPlan.type as BlockType,
          input,
          index + 1,
        );

        setBlocks((prev) => {
          const next = [...prev];
          next[index] = nextBlock;
          return next;
        });
      } catch (err) {
        setError(errorToString(err));
      } finally {
        setIsGenerating(false);
        isGeneratingRef.current = false;
        if (inFlightRef.current?.requestId === requestId) {
          inFlightRef.current = null;
        }
      }
    },
    [workbookPlan, chatModel, categoryId, createBlockFromToolInput, planKey],
  );

  useEffect(() => {
    if (!canGenerate || isCompleted || error) return;
    if (currentIndex < 0 || currentIndex >= totalCount) return;
    if (blocksRef.current[currentIndex]) return;
    generateBlock(currentIndex);
  }, [
    canGenerate,
    currentIndex,
    error,
    isCompleted,
    totalCount,
    generateBlock,
  ]);

  const handleUpdateSubmitAnswer = useCallback(
    (id: string, answer: StateUpdate<BlockAnswerSubmit>) => {
      setSubmits((prev) => {
        const nextSubmits = { ...prev };
        const block = blocksRef.current.find((b) => b?.id === id);
        if (!block) return prev;
        nextSubmits[id] = applyStateUpdate(
          { ...initialSubmitAnswer(block.type), ...nextSubmits[id] },
          answer,
        );
        return nextSubmits;
      });
    },
    [],
  );

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalCount - 1));
  }, [totalCount]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleComplete = useCallback(() => {
    setCompletedAt(new Date());
    setIsCompleted(true);
  }, []);

  const handleRestart = useCallback(() => {
    setIsCompleted(false);
    setCompletedAt(null);
    // blocks는 유지하고 답변만 초기화
    setSubmits({});
    setCurrentIndex(0);
    startTimeRef.current = new Date();
    // 세션도 현재 blocks 상태로 업데이트 (답변만 초기화)
    if (planKey) {
      const persistedBlocks = blocksRef.current.filter(
        Boolean,
      ) as WorkBookBlock[];
      saveSession({
        planKey,
        categoryId,
        currentIndex: 0,
        blocks: persistedBlocks,
        submits: {},
        completedAt: undefined,
        updatedAt: new Date().toISOString(),
      });
    }
    inFlightRef.current = null;
  }, [planKey, categoryId, saveSession]);

  const handleBackToPlan = useCallback(() => {
    inFlightRef.current = null;
    router.push("/workbooks/instant");
  }, [router]);

  const handleSave = useCallback(async () => {
    await notify.alert({
      title: "준비중",
      description: "문제집 저장 기능은 곧 추가할게요.",
    });
  }, []);

  if (!workbookPlan) {
    return (
      <EmptyState
        title="플랜이 없습니다"
        description="먼저 문제집 플랜을 생성해주세요."
        onAction={handleBackToPlan}
        actionLabel="플랜 만들기"
      />
    );
  }

  if (categoryId <= 0) {
    return (
      <EmptyState
        title="카테고리가 없습니다"
        description="카테고리를 다시 선택해주세요."
        onAction={handleBackToPlan}
        actionLabel="카테고리 선택"
      />
    );
  }

  if (!chatModel) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>모델 준비 중</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (isCompleted && reviewSession) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={handleRestart}>
            다시 풀기
          </Button>
          <Button variant="secondary" onClick={handleSave}>
            문제집 저장
          </Button>
          <Button onClick={handleBackToPlan}>다른 문제집 만들기</Button>
        </div>
        <WorkBookReview session={reviewSession} hideActions />
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

      <Card>
        <CardHeader className="space-y-3">
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
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">
            문제 {Math.min(currentIndex + 1, totalCount)}
          </CardTitle>
          <Badge variant="secondary">
            {currentPlanType ? blockDisplayNames[currentPlanType] : "문제"}
          </Badge>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                onClick={() => generateBlock(currentIndex)}
                disabled={isGenerating}
                variant="secondary"
              >
                다시 생성
              </Button>
            </div>
          ) : currentBlock ? (
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
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center gap-2">
          <Button
            onClick={handlePrevious}
            variant="ghost"
            disabled={currentIndex === 0 || isGenerating}
          >
            이전
          </Button>
          {isLast ? (
            <Button
              className="ml-auto"
              onClick={handleComplete}
              disabled={isGenerating || !currentBlock}
            >
              풀이 완료
            </Button>
          ) : (
            <Button
              className="ml-auto"
              onClick={handleNext}
              disabled={isGenerating || !currentBlock}
            >
              다음
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {description}
      </CardContent>
      <CardFooter>
        <Button onClick={onAction}>{actionLabel}</Button>
      </CardFooter>
    </Card>
  );
}
