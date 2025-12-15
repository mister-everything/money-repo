"use client";
import {
  BlockType,
  getBlockDisplayName,
  WorkBookBlock,
} from "@service/solves/shared";
import { ToolUIPart } from "ai";
import { AlertTriangleIcon, CheckIcon } from "lucide-react";
import { ReactNode, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { useShallow } from "zustand/shallow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextShimmer } from "@/components/ui/text-shimmer";
import {
  GEN_MCQ_MULTIPLE_TOOL_NAME,
  GEN_MCQ_TOOL_NAME,
  GEN_OX_TOOL_NAME,
  GEN_RANKING_TOOL_NAME,
  GEN_SUBJECTIVE_TOOL_NAME,
  GenerateMcqInput,
  GenerateMcqMultipleInput,
  GenerateOxInput,
  GenerateRankingInput,
  GenerateSubjectiveInput,
  GenerateToolNameType,
} from "@/lib/ai/tools/workbook/types";
import { MAX_BLOCK_COUNT } from "@/lib/const";
import { cn } from "@/lib/utils";
import { useWorkbookEditStore } from "@/store/workbook-edit-store";

const toolNameToBlockType: Record<GenerateToolNameType, BlockType> = {
  [GEN_MCQ_TOOL_NAME]: "mcq",
  [GEN_MCQ_MULTIPLE_TOOL_NAME]: "mcq-multiple",
  [GEN_SUBJECTIVE_TOOL_NAME]: "default",
  [GEN_RANKING_TOOL_NAME]: "ranking",
  [GEN_OX_TOOL_NAME]: "ox",
};

// 문제 생성중 컴포넌트
function BaseCard({
  title,
  isPending,
  children,
}: {
  title: string;
  isPending: boolean;
  children: ReactNode;
}) {
  return (
    <div className="text-sm rounded-lg border bg-background p-4 shadow-sm space-y-3 fade-300">
      <div className="font-semibold text-foreground">
        {isPending ? (
          <TextShimmer className="text-sm">문제 생성중</TextShimmer>
        ) : (
          <Badge className="rounded-full">{title}</Badge>
        )}
      </div>
      {children}
    </div>
  );
}

export function GenerateToolPart({
  part,
  type,
}: {
  part: ToolUIPart;
  type: GenerateToolNameType;
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
  const output = part.output as WorkBookBlock | undefined;
  const blockType = toolNameToBlockType[type];

  const appendedBlock = useMemo(() => {
    if (!output) return false;
    return blocks.some((block) => block.id === output.id);
  }, [blocks, output]);

  const handleAppendBlock = useCallback(
    (block: WorkBookBlock) => {
      if (blocksLength >= MAX_BLOCK_COUNT) {
        toast.warning(`문제는 최대 ${MAX_BLOCK_COUNT}개까지 입니다.`);
        return;
      }
      appendBlock(block);
    },
    [appendBlock, blocksLength],
  );

  const content = useMemo(() => {
    switch (type) {
      case GEN_MCQ_TOOL_NAME: {
        const mcqInput = input as Partial<GenerateMcqInput> | undefined;
        return (
          <>
            <div className="text-foreground py-2">
              <Streamdown>{mcqInput?.question ?? ""}</Streamdown>
            </div>
            <div className="space-y-2">
              {mcqInput?.options?.map((opt, index) => {
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
                      checked={isCorrect}
                      className="h-4 w-4 accent-primary"
                    />
                    <span>{opt}</span>
                    {isCorrect && (
                      <span className="ml-auto text-xs text-primary">정답</span>
                    )}
                  </label>
                );
              })}
            </div>
            {mcqInput?.solution && (
              <div className="text-xspx-3 p-2 text-muted-foreground">
                {mcqInput.solution}
              </div>
            )}
          </>
        );
      }
      case GEN_MCQ_MULTIPLE_TOOL_NAME: {
        const mcqInput = input as Partial<GenerateMcqMultipleInput> | undefined;
        return (
          <>
            <div className="text-foreground py-2">
              <Streamdown>{mcqInput?.question ?? ""}</Streamdown>
            </div>
            <div className="space-y-2">
              {mcqInput?.options?.map((opt, index) => {
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
                      checked={isCorrect}
                      className="h-4 w-4 accent-primary"
                    />
                    <span>{opt}</span>
                    {isCorrect && (
                      <span className="ml-auto text-xs text-primary">정답</span>
                    )}
                  </label>
                );
              })}
            </div>
            {mcqInput?.solution && (
              <div className="text-xspx-3 p-2 text-muted-foreground">
                {mcqInput.solution}
              </div>
            )}
          </>
        );
      }
      case GEN_RANKING_TOOL_NAME: {
        const rankingInput = input as Partial<GenerateRankingInput> | undefined;
        const orderedItems =
          rankingInput?.correctOrderIndexes && rankingInput?.items
            ? rankingInput.correctOrderIndexes
                .map((index) => rankingInput.items?.[index])
                .filter(Boolean)
            : (rankingInput?.items ?? []);

        return (
          <>
            <div className="text-foreground py-2">
              <Streamdown>{rankingInput?.question ?? ""}</Streamdown>
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
              <div className="text-xspx-3 p-2 text-muted-foreground">
                {rankingInput.solution}
              </div>
            )}
          </>
        );
      }
      case GEN_OX_TOOL_NAME: {
        const oxInput = input as Partial<GenerateOxInput> | undefined;
        return (
          <>
            <div className="text-foreground py-2">
              <Streamdown>{oxInput?.question ?? ""}</Streamdown>
            </div>
            <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm fade-300 border-muted bg-muted/40">
              <span className="font-semibold text-primary">
                {oxInput?.answer ? "O" : "X"}
              </span>
              <span className="text-muted-foreground text-xs">정답</span>
            </div>
            {oxInput?.solution && (
              <div className="text-xspx-3 p-2 text-muted-foreground">
                {oxInput.solution}
              </div>
            )}
          </>
        );
      }
      case GEN_SUBJECTIVE_TOOL_NAME:
      default: {
        const subjectiveInput = input as
          | Partial<GenerateSubjectiveInput>
          | undefined;
        return (
          <>
            <div className="text-foreground py-2">
              <Streamdown>{subjectiveInput?.question ?? ""}</Streamdown>
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
              <div className="text-xspx-3 p-2 text-muted-foreground">
                {subjectiveInput.solution}
              </div>
            )}
          </>
        );
      }
    }
  }, [input, type]);

  return (
    <BaseCard title={getBlockDisplayName(blockType)} isPending={isPending}>
      {content}
      {part.errorText ? (
        <p className="text-destructive text-xs text-center py-2 font-semibold flex items-center justify-center gap-2">
          <AlertTriangleIcon className="size-3" />
          문제 생성에 문제가 발생했어요.
        </p>
      ) : !isPending && output ? (
        <Button
          className="w-full"
          variant={appendedBlock ? "ghost" : "default"}
          size="sm"
          disabled={appendedBlock}
          onClick={() => handleAppendBlock(output)}
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
