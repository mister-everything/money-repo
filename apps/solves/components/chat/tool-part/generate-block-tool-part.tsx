"use client";
import {
  BlockType,
  getBlockDisplayName,
  WorkBookBlock,
} from "@service/solves/shared";
import { normalizeNewLine } from "@workspace/util";
import { ToolUIPart } from "ai";
import { motion } from "framer-motion";
import { AlertTriangleIcon, CheckIcon, CircleIcon, XIcon } from "lucide-react";
import { ReactNode, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { useShallow } from "zustand/shallow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GradualSpacingText } from "@/components/ui/gradual-spacing-text";
import { Skeleton } from "@/components/ui/skeleton";
import { TextShimmer } from "@/components/ui/text-shimmer";
import {
  GEN_BLOCK_TOOL_NAMES,
  GenerateMcqInput,
  GenerateMcqMultipleInput,
  GenerateOxInput,
  GenerateRankingInput,
  GenerateSubjectiveInput,
  mcqMultipleToolInputToBlock,
  mcqToolInputToBlock,
  oxToolInputToBlock,
  rankingToolInputToBlock,
  subjectiveToolInputToBlock,
} from "@/lib/ai/tools/workbook/shared";
import { MAX_BLOCK_COUNT } from "@/lib/const";
import { cn } from "@/lib/utils";
import { useWorkbookEditStore } from "@/store/workbook-edit-store";

const toolNameToBlockType: Record<GEN_BLOCK_TOOL_NAMES, BlockType> = {
  [GEN_BLOCK_TOOL_NAMES.MCQ]: "mcq",
  [GEN_BLOCK_TOOL_NAMES.MCQ_MULTIPLE]: "mcq-multiple",
  [GEN_BLOCK_TOOL_NAMES.SUBJECTIVE]: "default",
  [GEN_BLOCK_TOOL_NAMES.RANKING]: "ranking",
  [GEN_BLOCK_TOOL_NAMES.OX]: "ox",
};

// 문제 생성중 컴포넌트
function BaseCard({
  title,
  isPending,
  children,
  disabled,
  className,
}: {
  title: string;
  isPending: boolean;
  children: ReactNode;
  disabled: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-sm rounded-lg border bg-background p-4 space-y-3 fade-1000",
        (isPending || disabled) &&
          "text-muted-foreground border-secondary shadow-none bg-secondary",
        isPending && "animate-pulse",
        className,
      )}
    >
      <div className="font-semibold text-foreground">
        {isPending ? (
          <TextShimmer className="text-sm fade-300">문제 생성중</TextShimmer>
        ) : (
          <Badge className="rounded-full fade-300">{title}</Badge>
        )}
      </div>
      {children}
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
      {/* 1. The Resulting Skeleton Block */}
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

      {/* 2. The Selection Box (Dashed) */}
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
        className="absolute top-0 left-0 border-2 border-dashed border-primary bg-primary/5 z-10 rounded-lg backdrop-blur-[1px]"
      />
    </div>
  );
}

function LayoutOne() {
  return (
    <div className="grid grid-cols-2 gap-4 w-full h-full">
      {/* Left Column - Big Block */}
      <BuildingBlock className="h-full" delay={0} />

      {/* Right Column - Two Stacked Blocks */}
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
      {/* Top - Big Block */}
      <BuildingBlock className="h-1/2" delay={0} />

      {/* Bottom - Two Columns */}
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

function PendingGenerationUI({
  type,
  part,
}: {
  type: GEN_BLOCK_TOOL_NAMES;
  part: ToolUIPart;
}) {
  const blockType = toolNameToBlockType[type];
  const displayName = getBlockDisplayName(blockType);
  const input = part.input as any;
  const question = input?.question;

  const Layout = useMemo(() => {
    const layouts = [LayoutOne, LayoutTwo, LayoutThree];
    return layouts[Math.floor(Math.random() * layouts.length)];
  }, []);

  return (
    <div className="flex flex-col gap-3 min-w-[300px] w-full fade-300">
      <div className="flex items-center text-muted-foreground gap-2 text-sm">
        <TextShimmer>문제 생성 중</TextShimmer>
      </div>
      <div className="relative overflow-hidden rounded-xl border bg-background/50 h-[320px] flex flex-col">
        <div className="absolute inset-x-0 top-0 z-10 h-12 bg-linear-to-b from-background to-transparent" />

        <div className="flex-1 overflow-hidden relative p-4">
          <Layout />
        </div>

        {/* Fixed Status Footer */}
        <div className="relative z-20 p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>
              <GradualSpacingText
                text={`${displayName} 문제 생성하고 있어요`}
              />
            </span>
          </div>
          {question && (
            <div className="text-xs text-muted-foreground truncate">
              <GradualSpacingText text={question} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function GenerateBlockToolPart({
  part,
  type,
}: {
  part: ToolUIPart;
  type: GEN_BLOCK_TOOL_NAMES;
}) {
  const [appendBlock, blocks] = useWorkbookEditStore(
    useShallow((state) => [state.appendBlock, state.blocks]),
  );
  const blocksLength = useMemo(() => blocks.length, [blocks]);

  const isPending = useMemo(
    () => !part.state.startsWith(`output-`),
    [part.state],
  );

  const input = part.input;
  const output = part.output as { id: string } | undefined;
  const blockType = toolNameToBlockType[type];

  const appendedBlock = useMemo(() => {
    if (!output) return false;
    return blocks.some((block) => block.id === output.id);
  }, [blocks, output]);

  const handleAppendBlock = useCallback(
    (id: string, aiInput: any) => {
      if (blocksLength >= MAX_BLOCK_COUNT) {
        toast.warning(`문제는 최대 ${MAX_BLOCK_COUNT}개까지 입니다.`);
        return;
      }
      let block: WorkBookBlock | undefined;
      switch (type) {
        case GEN_BLOCK_TOOL_NAMES.MCQ: {
          block = mcqToolInputToBlock({
            id,
            input: aiInput as GenerateMcqInput,
          });
          break;
        }
        case GEN_BLOCK_TOOL_NAMES.MCQ_MULTIPLE: {
          block = mcqMultipleToolInputToBlock({
            id,
            input: aiInput as GenerateMcqMultipleInput,
          });
          break;
        }
        case GEN_BLOCK_TOOL_NAMES.SUBJECTIVE: {
          block = subjectiveToolInputToBlock({
            id,
            input: aiInput as GenerateSubjectiveInput,
          });
          break;
        }
        case GEN_BLOCK_TOOL_NAMES.RANKING: {
          block = rankingToolInputToBlock({
            id,
            input: aiInput as GenerateRankingInput,
          });
          break;
        }
        case GEN_BLOCK_TOOL_NAMES.OX: {
          block = oxToolInputToBlock({
            id,
            input: aiInput as GenerateOxInput,
          });
          break;
        }
        default: {
          toast.error(`문제가 발생했어요.`);
        }
      }
      block && appendBlock(block);
    },
    [appendBlock, blocksLength],
  );

  const content = useMemo(() => {
    switch (type) {
      case GEN_BLOCK_TOOL_NAMES.MCQ: {
        const mcqInput = input as Partial<GenerateMcqInput> | undefined;
        return (
          <>
            <div className="py-2 fade-300">
              <Streamdown>
                {normalizeNewLine(mcqInput?.question ?? "")}
              </Streamdown>
            </div>
            <div className="space-y-2">
              {mcqInput?.options?.map?.((opt, index) => {
                const isCorrect = index === mcqInput?.correctOptionIndex;
                return (
                  <label
                    key={index}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-2 text-sm fade-300",
                      isCorrect
                        ? "border-primary/60 bg-primary/5 text-primary"
                        : "border-muted bg-muted/40",
                    )}
                  >
                    <input
                      type="radio"
                      readOnly
                      checked={isCorrect ?? false}
                      className="h-4 w-4 accent-primary"
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
            {mcqInput?.solution && (
              <div className="text-xspx-3 p-2 text-muted-foreground fade-300">
                {mcqInput.solution}
              </div>
            )}
          </>
        );
      }
      case GEN_BLOCK_TOOL_NAMES.MCQ_MULTIPLE: {
        const mcqInput = input as Partial<GenerateMcqMultipleInput> | undefined;
        return (
          <>
            <div className="py-2 fade-300">
              <Streamdown>
                {normalizeNewLine(mcqInput?.question ?? "")}
              </Streamdown>
            </div>
            <div className="space-y-2">
              {mcqInput?.options?.map?.((opt, index) => {
                const isCorrect =
                  mcqInput?.correctOptionIndexes?.includes(index);
                return (
                  <label
                    key={index}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-2 text-sm fade-300",
                      isCorrect
                        ? "border-primary/60 bg-primary/5 text-primary"
                        : "border-muted bg-muted/40",
                    )}
                  >
                    <input
                      type="radio"
                      readOnly
                      checked={isCorrect ?? false}
                      className="h-4 w-4 accent-primary"
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
            {mcqInput?.solution && (
              <div className="text-xspx-3 p-2 text-muted-foreground fade-300">
                {mcqInput.solution}
              </div>
            )}
          </>
        );
      }
      case GEN_BLOCK_TOOL_NAMES.RANKING: {
        const rankingInput = input as Partial<GenerateRankingInput> | undefined;
        const orderedItems =
          rankingInput?.correctOrderIndexes && rankingInput?.items
            ? rankingInput.correctOrderIndexes
                .map((index) => rankingInput.items?.[index])
                .filter(Boolean)
            : (rankingInput?.items ?? []);

        return (
          <>
            <div className="py-2 fade-300">
              <Streamdown>
                {normalizeNewLine(rankingInput?.question ?? "")}
              </Streamdown>
            </div>
            <div className="space-y-2">
              {orderedItems?.map((item, idx) => (
                <div
                  key={`${item}-${idx}`}
                  className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm fade-300 border-muted bg-muted/40"
                >
                  <span className="text-xs text-muted-foreground">
                    {idx + 1}.
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            {rankingInput?.solution && (
              <div className="text-xspx-3 p-2 text-muted-foreground fade-300">
                {rankingInput.solution}
              </div>
            )}
          </>
        );
      }
      case GEN_BLOCK_TOOL_NAMES.OX: {
        const oxInput = input as Partial<GenerateOxInput> | undefined;
        return (
          <>
            <div className="py-2 fade-300">
              <Streamdown>
                {normalizeNewLine(oxInput?.question ?? "")}
              </Streamdown>
            </div>
            <div className="grid grid-cols-2 gap-4 h-44 lg:h-64">
              <div
                className={cn(
                  "justify-center text-muted-foreground border flex h-full w-full items-center rounded-lg transition-colors",
                  oxInput?.answer
                    ? "border-primary/60 bg-primary/5 text-primary"
                    : "border-muted bg-muted/40",
                )}
              >
                <CircleIcon className="size-14 md:size-24" />
              </div>
              <div
                className={cn(
                  "justify-center text-muted-foreground border flex h-full w-full items-center rounded-lg transition-colors",
                  !oxInput?.answer
                    ? "border-primary/60 bg-primary/5 text-primary"
                    : "border-muted bg-muted/40",
                )}
              >
                <XIcon className="size-14 md:size-24" />
              </div>
            </div>
            {oxInput?.solution && (
              <div className="text-xspx-3 p-2 text-muted-foreground fade-300">
                {oxInput.solution}
              </div>
            )}
          </>
        );
      }
      case GEN_BLOCK_TOOL_NAMES.SUBJECTIVE:
      default: {
        const subjectiveInput = input as
          | Partial<GenerateSubjectiveInput>
          | undefined;
        return (
          <>
            <div className="py-2 fade-300">
              <Streamdown>
                {normalizeNewLine(subjectiveInput?.question ?? "")}
              </Streamdown>
            </div>
            <div className="flex flex-wrap gap-2">
              {subjectiveInput?.answers?.map((ans: string, idx: number) => (
                <span
                  key={`${ans}-${idx}`}
                  className="rounded-full border bg-muted px-3 py-1 text-xs text-foreground fade-300"
                >
                  {ans}
                </span>
              ))}
            </div>
            {subjectiveInput?.solution && (
              <div className="text-xspx-3 p-2 text-muted-foreground fade-300">
                {subjectiveInput.solution}
              </div>
            )}
          </>
        );
      }
    }
  }, [input, type]);

  if (isPending && !part.errorText) {
    // if ((isPending && !part.errorText) || true) {
    return <PendingGenerationUI type={type} part={part} />;
  }

  return (
    <BaseCard
      title={getBlockDisplayName(blockType)}
      isPending={isPending}
      disabled={appendedBlock || Boolean(part.errorText)}
    >
      {content}
      {part.errorText ? (
        <p className="text-muted-foreground text-sm text-center py-2 flex items-center justify-center gap-2">
          <AlertTriangleIcon className="size-3" />
          문제 생성에 문제가 발생했어요.
        </p>
      ) : !isPending && output ? (
        <Button
          className="w-full fade-300"
          variant={appendedBlock ? "ghost" : "default"}
          size="sm"
          disabled={appendedBlock}
          onClick={() => output && handleAppendBlock(output.id, input)}
        >
          {appendedBlock ? (
            <>
              <CheckIcon className="size-3" />
              문제집에 추가되었어요
            </>
          ) : (
            "문제집에 적용하기"
          )}
        </Button>
      ) : null}
    </BaseCard>
  );
}
