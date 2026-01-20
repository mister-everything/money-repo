"use client";

import {
  BlockAnswerSubmit,
  initialSubmitAnswer,
  WorkBookBlockWithoutAnswer,
  WorkBookWithoutAnswer,
} from "@service/solves/shared";
import { applyStateUpdate, isNull, StateUpdate } from "@workspace/util";
import confetti from "canvas-confetti";
import { LoaderIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { submitWorkbookSessionAction } from "@/actions/workbook";
import { Button } from "@/components/ui/button";
import { useToRef } from "@/hooks/use-to-ref";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { GoBackButton } from "../layouts/go-back-button";
import { Block } from "./block/block";
import { BlockSequential } from "./block/block-sequential";
import { SolveModeSelector } from "./solve-mode-selector";
import { WorkbookHeader } from "./workbook-header";

interface WorkBookSolveProps {
  workBook: WorkBookWithoutAnswer;
}

export function WorkBookSolve({
  workBook: { blocks, ...workBook },
}: WorkBookSolveProps) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  // 풀이 시작 시간 기록
  const startTimeRef = useRef<Date>(new Date());

  const [mode, setMode] = useState<"all" | "sequential">();

  const [submits, setSubmits] = useState<Record<string, BlockAnswerSubmit>>({});

  const [, submitWorkbookSession, isSubmitting] = useSafeAction(
    submitWorkbookSessionAction,
    {
      onSuccess: (result) => {
        handleConfetti();
        router.push(`/workbooks/session/${result.submitId}/review`);
      },
    },
  );

  const stateRef = useToRef({
    isSubmitting,
    blocks,
    submits,
  });

  const [sequentialCursor, setSequentialCursor] = useState<number>(0);

  const sequentialBlock = useMemo<
    WorkBookBlockWithoutAnswer | undefined
  >(() => {
    const cursor = Math.max(0, Math.min(blocks.length - 1, sequentialCursor));
    return blocks[cursor];
  }, [blocks, sequentialCursor]);

  const handleSubmit = useCallback(async () => {
    if (stateRef.current.isSubmitting) return;
    submitWorkbookSession({
      workBookId: workBook.id,
      answers: stateRef.current.submits,
      startTime: startTimeRef.current.toISOString(),
    });
  }, [workBook.id, submitWorkbookSession]);

  const onNext = useCallback(() => {
    setSequentialCursor((prev) => Math.min(prev + 1, blocks.length - 1));
  }, [blocks.length]);

  const onPrevious = useCallback(() => {
    setSequentialCursor((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleUpdateSubmitAnswer = useCallback(
    (id: string, answer: StateUpdate<BlockAnswerSubmit>) => {
      if (stateRef.current.isSubmitting) return;
      setSubmits((prev) => {
        const nextSubmits = { ...prev };
        const block = stateRef.current.blocks.find((b) => b.id === id);
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

  return (
    <div ref={ref} className="w-full h-full pb-20">
      <div className="py-4 sticky top-0 left-0 z-10 w-full">
        <GoBackButton>뒤로가기</GoBackButton>
      </div>

      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
        <WorkbookHeader book={workBook} mode="solve" />
        {isNull(mode) ? (
          <SolveModeSelector
            totalCount={blocks.length}
            onModeSelect={setMode}
          />
        ) : mode == "all" ? (
          <div className="flex flex-col gap-6">
            {blocks.map((block, index) => {
              return (
                <Block
                  key={block.id}
                  content={block.content}
                  id={block.id}
                  index={index}
                  order={block.order}
                  type={block.type}
                  mode="solve"
                  question={block.question}
                  onUpdateSubmitAnswer={handleUpdateSubmitAnswer.bind(
                    null,
                    block.id,
                  )}
                  submit={submits[block.id]}
                />
              );
            })}
            <div className="w-full">
              <Button onClick={handleSubmit} size="lg" className="w-full">
                {isSubmitting && <LoaderIcon className="size-4 animate-spin" />}
                제출하고 결과 보기
              </Button>
            </div>
          </div>
        ) : (
          <BlockSequential
            onNext={onNext}
            onPrevious={onPrevious}
            onSubmit={handleSubmit}
            isPending={isSubmitting}
            totalCount={blocks.length}
            currentIndex={sequentialCursor}
            blockProps={
              sequentialBlock
                ? {
                    content: sequentialBlock.content,
                    id: sequentialBlock.id,
                    index: sequentialCursor,
                    order: sequentialBlock.order,
                    type: sequentialBlock.type,
                    mode: "solve",
                    question: sequentialBlock.question,
                    onUpdateSubmitAnswer: handleUpdateSubmitAnswer.bind(
                      null,
                      sequentialBlock.id,
                    ),
                    submit: submits[sequentialBlock.id],
                  }
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}

function handleConfetti() {
  const end = Date.now() + 1 * 1000;
  const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

  const frame = () => {
    if (Date.now() > end) return;

    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors: colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors: colors,
    });

    requestAnimationFrame(frame);
  };

  frame();
}
