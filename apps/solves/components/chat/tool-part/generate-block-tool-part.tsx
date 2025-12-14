"use client";
import { getBlockDisplayName, WorkBookBlock } from "@service/solves/shared";
import { ToolUIPart } from "ai";
import { AlertTriangleIcon, CheckIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { useShallow } from "zustand/shallow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextShimmer } from "@/components/ui/text-shimmer";
import {
  GenerateMcqInput,
  GenerateSubjectiveInput,
} from "@/lib/ai/tools/types";
import { MAX_BLOCK_COUNT } from "@/lib/const";
import { cn } from "@/lib/utils";
import { useWorkbookEditStore } from "@/store/workbook-edit-store";

export function GenerateMcqToolPart({ part }: { part: ToolUIPart }) {
  const [appendBlock, blocks] = useWorkbookEditStore(
    useShallow((state) => [state.appendBlock, state.blocks]),
  );
  const blocksLength = useMemo(() => blocks.length, [blocks]);

  const isPending = useMemo(() => {
    return !part.state.startsWith(`output-`);
  }, [part.state]);

  const input = useMemo(() => {
    return part.input as Partial<GenerateMcqInput> | undefined;
  }, [part.input]);

  const output = useMemo(() => {
    return part.output as WorkBookBlock<"mcq"> | undefined;
  }, [part.output]);
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
    [blocksLength],
  );

  return (
    <div className="text-sm rounded-lg border bg-background p-4 shadow-sm space-y-3 fade-300">
      <div className="font-semibold text-foreground">
        {isPending ? (
          <TextShimmer className="text-sm">문제 생성중</TextShimmer>
        ) : (
          <Badge className="rounded-full">{getBlockDisplayName("mcq")}</Badge>
        )}
      </div>
      <div className="text-foreground py-2">
        <Streamdown>{input?.question}</Streamdown>
      </div>
      <div className="space-y-2">
        {input?.options?.map((opt, index) => {
          const isCorrect = index === input?.correctOptionIndex;
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
      {input?.solution && (
        <div className="text-xspx-3 p-2 text-muted-foreground">
          {input.solution}
        </div>
      )}
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
    </div>
  );
}

export function GenerateSubjectiveToolPart({ part }: { part: ToolUIPart }) {
  const [appendBlock, blocks] = useWorkbookEditStore(
    useShallow((state) => [state.appendBlock, state.blocks]),
  );
  const blocksLength = useMemo(() => blocks.length, [blocks]);

  const isPending = useMemo(() => {
    return !part.state.startsWith(`output-`);
  }, [part.state]);

  const input = useMemo(() => {
    return part.input as Partial<GenerateSubjectiveInput> | undefined;
  }, [part.input]);

  const output = useMemo(() => {
    return part.output as WorkBookBlock<"default"> | undefined;
  }, [part.output]);

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
    [blocksLength],
  );
  return (
    <div className="text-sm rounded-lg border bg-background p-4 shadow-sm space-y-3 fade-300">
      <div className="font-semibold text-foreground">
        {isPending ? (
          <TextShimmer className="text-sm">문제 생성중</TextShimmer>
        ) : (
          <Badge className="rounded-full">
            {getBlockDisplayName("default")}
          </Badge>
        )}
      </div>
      <div className="text-foreground py-2">
        <Streamdown>{input?.question}</Streamdown>
      </div>
      <div className="flex flex-wrap gap-2">
        {input?.answers?.map((ans: string, idx: number) => (
          <span
            key={`${ans}-${idx}`}
            className="rounded-full border bg-muted px-3 py-1 text-xs text-foreground fade-300"
          >
            {ans}
          </span>
        ))}
      </div>
      {input?.solution && (
        <div className="text-xspx-3 p-2 text-muted-foreground">
          {input.solution}
        </div>
      )}
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
    </div>
  );
}
