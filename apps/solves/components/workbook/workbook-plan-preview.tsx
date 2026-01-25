"use client";

import { blockDisplayNames } from "@service/solves/shared";
import { motion } from "framer-motion";
import { SignalHigh, SignalLow, SignalMedium } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

import { GradualSpacingText } from "@/components/ui/gradual-spacing-text";
import { Skeleton } from "@/components/ui/skeleton";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { useCategories } from "@/hooks/query/use-categories";
import { WorkbookPlan } from "@/lib/ai/tools/workbook/workbook-plan";
import { cn } from "@/lib/utils";

const difficultyMeta = {
  easy: { label: "쉬움", icon: SignalLow, tone: "text-emerald-500" },
  medium: { label: "보통", icon: SignalMedium, tone: "text-amber-500" },
  hard: { label: "도전", icon: SignalHigh, tone: "text-rose-500" },
} as const;

interface PlanPreviewProps {
  plan?: WorkbookPlan;
  isLoading?: boolean;
  prompt?: string;
  blockCount?: number;
  categoryId?: number;
}

export function PlanPreview({
  plan,
  isLoading = false,
  prompt,
  blockCount = plan?.blockPlans.length ?? 0,
  categoryId,
}: PlanPreviewProps) {
  if (isLoading) {
    return <PlanGenerationLoading prompt={prompt} blockCount={blockCount} />;
  }

  if (!plan) return null;

  const { data: categories = [] } = useCategories();

  const category = useMemo(() => {
    return categories.find((c) => c.id === categoryId);
  }, [categories, categoryId]);

  const difficulty = difficultyMeta[plan.overview.difficulty ?? "medium"];
  const DifficultyIcon = difficulty.icon;

  return (
    <div className="space-y-4 w-full p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{plan.overview.title}</h2>
        </div>
        <Badge variant="outline" className="rounded-full">
          {category?.name ?? "선택한 소재"}
        </Badge>
      </div>

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="w-1/2 space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">설명</p>
            <p className="text-sm text-foreground">
              {plan.overview.description}
            </p>
          </div>
          <div className="grid gap-3 grid-cols-2 text-sm">
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">목표</p>
              <p className="font-medium">{plan.overview.goal}</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">대상</p>
              <p className="font-medium">{plan.overview.targetAudience}</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 flex items-center gap-2">
              <div
                className={cn("rounded-full bg-muted/60 p-2", difficulty.tone)}
              >
                <DifficultyIcon className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">난이도</p>
                <p className="font-medium">{difficulty.label}</p>
              </div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">문제 수</p>
              <p className="font-medium">{blockCount}문제</p>
            </div>
          </div>
          {(plan.constraints?.length || plan.guidelines?.length) && (
            <div className="space-y-2 text-sm">
              {plan.constraints?.length ? (
                <div>
                  <p className="text-xs text-muted-foreground">제약</p>
                  <ul>
                    {plan.constraints.map((constraint) => (
                      <li key={constraint}>{constraint}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {plan.guidelines?.length ? (
                <div>
                  <p className="text-xs text-muted-foreground">가이드</p>
                  <ul>
                    {plan.guidelines.map((guideline) => (
                      <li key={guideline}>{guideline}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="w-1/2 space-y-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>문제 계획 전체</span>
            <Badge variant="secondary" className="rounded-full">
              {plan.blockPlans.length}문제
            </Badge>
          </div>
          <div className="space-y-3 pr-1 scrollbar-hide">
            {plan.blockPlans.map((block, index) => {
              const blockDifficulty =
                difficultyMeta[block.expectedDifficulty ?? "medium"];
              const BlockDifficultyIcon = blockDifficulty.icon;
              return (
                <div
                  key={`${block.topic}-${index}`}
                  className="rounded-xl bg-muted/30 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>#{index + 1}</span>
                    <Badge variant="outline" className="rounded-full">
                      {blockDisplayNames[block.type]}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{block.topic}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "flex items-center gap-1",
                        blockDifficulty.tone,
                      )}
                    >
                      <BlockDifficultyIcon className="size-3" />
                      {blockDifficulty.label}
                    </span>
                    <span className="text-muted-foreground/50">-</span>
                    <span className="truncate">{block.learningObjective}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      <span className="font-semibold text-foreground/80">
                        의도:
                      </span>{" "}
                      {block.intent}
                    </p>
                    {block.notes ? (
                      <p>
                        <span className="font-semibold text-foreground/80">
                          메모:
                        </span>{" "}
                        {block.notes}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function BuildingBlock({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <div className={cn("relative w-full h-full", className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: [0, 1, 1, 0],
          scale: [0.95, 1, 1, 0.95],
        }}
        transition={{
          duration: 6,
          times: [0.2, 0.3, 0.8, 1],
          repeat: Number.POSITIVE_INFINITY,
          delay: delay,
          ease: "easeInOut",
        }}
        className="absolute inset-0 overflow-hidden"
      >
        <Skeleton className="w-full h-full rounded-xl opacity-50" />
      </motion.div>

      <motion.div
        initial={{ width: 0, height: 0, opacity: 0 }}
        animate={{
          width: ["0%", "100%", "100%", "100%"],
          height: ["0%", "100%", "100%", "100%"],
          opacity: [0, 1, 0, 0],
        }}
        transition={{
          duration: 6,
          times: [0, 0.15, 0.25, 1],
          repeat: Number.POSITIVE_INFINITY,
          delay: delay,
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0 border-2 border-dashed border-primary/40 bg-primary/5 z-10 rounded-xl"
      />
    </div>
  );
}

function LayoutOne() {
  return (
    <div className="grid grid-cols-2 gap-4 w-full h-full">
      <BuildingBlock className="h-full" delay={0} />
      <div className="flex flex-col gap-4 h-full">
        <BuildingBlock className="h-full" delay={1.5} />
        <BuildingBlock className="h-full" delay={3} />
      </div>
    </div>
  );
}

function LayoutTwo() {
  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <BuildingBlock className="h-1/2" delay={0} />
      <div className="grid grid-cols-2 gap-4 h-1/2">
        <BuildingBlock className="h-full" delay={1.5} />
        <BuildingBlock className="h-full" delay={3} />
      </div>
    </div>
  );
}

function LayoutThree() {
  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-4 w-full h-full">
      <BuildingBlock className="col-span-2" delay={0} />
      <BuildingBlock className="col-span-1" delay={1.2} />
      <BuildingBlock className="col-span-1" delay={2.4} />
      <BuildingBlock className="col-span-2" delay={3.6} />
    </div>
  );
}

function PlanGenerationLoading({
  prompt,
  blockCount,
}: {
  prompt?: string;
  blockCount: number;
}) {
  const layouts = [LayoutOne, LayoutTwo, LayoutThree];
  const Layout = useMemo(
    () => layouts[Math.floor(Math.random() * layouts.length)],
    [],
  );
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TextShimmer>계획 생성중</TextShimmer>
        <span className="text-xs">-</span>
        <span className="text-xs">예상 {blockCount}문제 구성</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-background/80 p-4">
        <div className="absolute inset-x-0 top-0 z-10 h-10 bg-linear-to-b from-background to-transparent" />
        <div className="h-[220px]">
          <Layout />
        </div>
        <div className="relative z-20 pt-4 text-xs text-muted-foreground">
          <GradualSpacingText text="문제 블록을 조합해서 계획을 구성하고 있어요." />
        </div>
      </div>

      <div className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">
        <GradualSpacingText
          text={
            prompt?.trim()
              ? `"${prompt.trim().slice(0, 80)}"`
              : "요청 내용을 바탕으로 계획을 만들고 있어요."
          }
        />
      </div>
    </div>
  );
}
