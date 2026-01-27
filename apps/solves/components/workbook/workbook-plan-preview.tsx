"use client";

import { blockDisplayNames } from "@service/solves/shared";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GradualSpacingText } from "@/components/ui/gradual-spacing-text";
import { Skeleton } from "@/components/ui/skeleton";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { useCategories } from "@/hooks/query/use-categories";
import { WorkbookPlan } from "@/lib/ai/tools/workbook/workbook-plan";
import { cn } from "@/lib/utils";

const difficultyLabel = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
} as const;

interface PlanPreviewProps {
  plan?: WorkbookPlan;
  isLoading?: boolean;
  prompt?: string;
  blockCount?: number;
  categoryId?: number;
  onStart?: () => void;
  onReset?: () => void;
}

export function PlanPreview({
  plan,
  isLoading = false,
  prompt,
  blockCount = plan?.blockPlans.length ?? 0,
  categoryId,
  onStart,
  onReset,
}: PlanPreviewProps) {
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [showConstraints, setShowConstraints] = useState(false);
  const { data: categories = [] } = useCategories();

  const category = useMemo(() => {
    return categories.find((c) => c.id === categoryId);
  }, [categories, categoryId]);

  if (isLoading) {
    return <PlanGenerationLoading prompt={prompt} blockCount={blockCount} />;
  }

  if (!plan) return null;

  const hasConstraintsOrGuidelines =
    (plan.constraints?.length ?? 0) > 0 || (plan.guidelines?.length ?? 0) > 0;

  return (
    <div className="w-full space-y-4">
      {/* 헤더: 제목 + 배지 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold flex-1 truncate">
            {plan.overview.title}
          </h2>

          <Badge className="rounded-full py-1">
            {category?.name ?? "선택한 소재"}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          {plan.overview.description}
        </p>
      </div>

      {/* 계획 요약 카드 */}
      <div className="rounded-xl space-y-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">대상</p>
          <p className="text-sm">{plan.overview.targetAudience}</p>
        </div>
        <div className="space-y-1 pt-2 ">
          <p className="text-xs text-muted-foreground font-medium">목표</p>
          <p className="text-sm">{plan.overview.goal}</p>
        </div>

        {hasConstraintsOrGuidelines && (
          <div className="pt-2">
            <Button
              variant={showConstraints ? "ghost" : "secondary"}
              size="lg"
              onClick={() => setShowConstraints(!showConstraints)}
              className="flex items-center justify-between w-full text-left"
            >
              <p className="text-xs font-medium">제약 및 가이드</p>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform duration-150",
                  showConstraints && "rotate-180",
                )}
              />
            </Button>
            <AnimatePresence>
              {showConstraints && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden px-4"
                >
                  <div className="space-y-3 pt-2 text-sm">
                    {plan.constraints?.length ? (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">제약</p>
                        <ul className="space-y-1">
                          {plan.constraints.map((c) => (
                            <li key={c} className="flex items-start gap-2">
                              <span className="text-muted-foreground">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {plan.guidelines?.length ? (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">가이드</p>
                        <ul className="space-y-1">
                          {plan.guidelines.map((g) => (
                            <li key={g} className="flex items-start gap-2">
                              <span className="text-muted-foreground">•</span>
                              <span>{g}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 버튼 */}
      {(onStart || onReset) && (
        <div className="flex items-center gap-2">
          {onReset && (
            <Button
              variant="secondary"
              size="lg"
              className="shadow-none bg-background dark:bg-muted"
              onClick={onReset}
            >
              다시 설계하기
            </Button>
          )}
          {onStart && (
            <Button onClick={onStart} size="lg" className="flex-1 gap-2">
              시작하기
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      )}

      {/* 문제 계획 (바로 보임) */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">문제 계획</p>
        <div className="space-y-1">
          {plan.blockPlans.map((block, index) => {
            const blockDifficulty = block.expectedDifficulty ?? "medium";
            const isExpanded = expandedBlock === index;

            return (
              <div
                key={`${block.topic}-${index}`}
                className={cn(
                  "rounded-lg transition-all duration-150",
                  isExpanded ? "bg-muted/20" : "bg-card hover:bg-muted/10",
                )}
              >
                <button
                  onClick={() => setExpandedBlock(isExpanded ? null : index)}
                  className="w-full text-left px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-sm font-medium text-muted-foreground tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-sm font-medium truncate flex-1">
                        {block.topic}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {difficultyLabel[blockDifficulty]}
                      </span>
                      <span className="text-muted-foreground mx-1">·</span>
                      <span className="text-xs text-muted-foreground">
                        {blockDisplayNames[block.type]}
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-3.5 text-muted-foreground transition-transform duration-150 ml-1",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 ml-7">
                    {block.learningObjective}
                  </div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 pt-2 space-y-3 text-sm ml-7">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>출제 의도</span>
                          </div>
                          <p>{block.intent}</p>
                        </div>
                        {block.notes && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span>주의사항</span>
                            </div>
                            <p>{block.notes}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
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
