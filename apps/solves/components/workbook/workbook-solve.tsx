"use client";

import {
  BlockAnswerSubmit,
  initialSubmitAnswer,
  WorkBookBlockWithoutAnswer,
  WorkBookSubmitSession,
  WorkBookWithoutAnswer,
} from "@service/solves/shared";
import {
  applyStateUpdate,
  createDebounce,
  equal,
  isNull,
  StateUpdate,
  TIME,
} from "@workspace/util";
import confetti from "canvas-confetti";
import { LoaderIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  saveAnswerProgressAction,
  submitWorkbookSessionAction,
} from "@/actions/workbook";
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
  initialSession: WorkBookSubmitSession;
}

const debounce = createDebounce();

export function WorkBookSolve({
  workBook: { blocks, ...workBook },
  initialSession,
}: WorkBookSolveProps) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"all" | "sequential">();

  const [submits, setSubmits] = useState<WorkBookSubmitSession["savedAnswers"]>(
    () => {
      return initialSession?.savedAnswers || {};
    },
  );

  const sumbmitSnapshot = useRef<WorkBookSubmitSession["savedAnswers"]>({
    ...initialSession.savedAnswers,
  });

  const [, saveAnswerProgress, isSaving] = useSafeAction(
    saveAnswerProgressAction,
    {
      onSuccess: () => {
        sumbmitSnapshot.current = {
          ...submits,
        };
      },
      failMessage: "답안 저장에 실패했습니다.",
      successMessage: "임시 저장",
    },
  );

  const [, submitWorkbookSession, isSubmitting] = useSafeAction(
    submitWorkbookSessionAction,
    {
      onSuccess: () => {
        handleConfetti();
        router.push(`/workbooks/${workBook.id}/review`);
      },
    },
  );

  const isPending = isSaving || isSubmitting;

  const stateRef = useToRef({
    isPending,
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

  const handleSaveAnswerProgress = useCallback(async () => {
    if (stateRef.current.isPending) return;
    const diff = extractSubmitsDiff(
      sumbmitSnapshot.current,
      stateRef.current.submits,
    );
    const hasDiff = Object.keys(diff).length > 0;
    if (!hasDiff) return;
    saveAnswerProgress({
      submitId: initialSession.submitId,
      answers: diff,
    });
  }, [initialSession.submitId]);

  const handleSubmit = useCallback(async () => {
    await handleSaveAnswerProgress();
    submitWorkbookSession({
      submitId: initialSession.submitId,
    });
  }, [handleSaveAnswerProgress]);

  const onNext = useCallback(() => {
    setSequentialCursor((prev) => Math.min(prev + 1, blocks.length - 1));
  }, []);
  const onPrevious = useCallback(() => {
    setSequentialCursor((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleUpdateSubmitAnswer = useCallback(
    (id: string, answer: StateUpdate<BlockAnswerSubmit>) => {
      if (stateRef.current.isPending) return;
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
      debounce(() => {
        handleSaveAnswerProgress();
      }, TIME.SECONDS(10));
    },
    [handleSaveAnswerProgress],
  );

  return (
    <div ref={ref} className="w-full h-full pb-24">
      <div className="sticky top-0 z-10 py-2 backdrop-blur-sm flex items-center gap-2">
        <GoBackButton>뒤로가기</GoBackButton>
      </div>

      <div className="max-w-3xl mx-auto w-full flex flex-col  gap-6">
        <WorkbookHeader book={workBook} mode="solve" />
        {isNull(mode) ? (
          <SolveModeSelector onModeSelect={setMode} />
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
                {isPending && <LoaderIcon className="size-4 animate-spin" />}
                답안 제출
              </Button>
            </div>
          </div>
        ) : (
          <BlockSequential
            onNext={onNext}
            onPrevious={onPrevious}
            onSubmit={handleSubmit}
            isPending={isPending}
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

function extractSubmitsDiff(
  prev: WorkBookSubmitSession["savedAnswers"] = {},
  next: WorkBookSubmitSession["savedAnswers"] = {},
) {
  return Object.entries(next).reduce(
    (acc, [blockId, answer]) => {
      const prevAnswer = prev[blockId];
      if (!prevAnswer || !equal(prevAnswer, answer)) {
        acc[blockId] = answer;
      }
      return acc;
    },
    {} as Record<string, BlockAnswerSubmit>,
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
