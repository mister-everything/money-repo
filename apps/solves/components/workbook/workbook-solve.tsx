"use client";

import {
  BlockAnswerSubmit,
  initialSubmitAnswer,
  WorkBookBlockWithoutAnswer,
  WorkBookSubmitSession,
  WorkBookWithoutAnswer,
} from "@service/solves/shared";
import { applyStateUpdate, isNull, StateUpdate } from "@workspace/util";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToRef } from "@/hooks/use-to-ref";
import { GoBackButton } from "../layouts/go-back-button";

import { Block } from "./block/block";
import { BlockSequential } from "./block/block-sequential";
import { SolveModeSelector } from "./solve-mode-selector";
import { WorkbookHeader } from "./workbook-header";

interface WorkBookSolveProps {
  workBook: WorkBookWithoutAnswer;
  initialSession?: WorkBookSubmitSession;
}

const handleConfetti = () => {
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
};

export function WorkBookSolve({
  workBook: { blocks, ...workBook },
  initialSession,
}: WorkBookSolveProps) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"all" | "sequential">();

  const answerSnapshot = useRef<WorkBookSubmitSession["savedAnswers"]>({
    ...(initialSession?.savedAnswers || {}),
  });

  const [sequentialCursor, setSequentialCursor] = useState<number>(0);

  const onNext = useCallback(() => {
    setSequentialCursor((prev) => Math.min(prev + 1, blocks.length - 1));
  }, []);
  const onPrevious = useCallback(() => {
    setSequentialCursor((prev) => Math.max(prev - 1, 0));
  }, []);

  const sequentialBlock = useMemo<
    WorkBookBlockWithoutAnswer | undefined
  >(() => {
    const cursor = Math.max(0, Math.min(blocks.length - 1, sequentialCursor));
    return blocks[cursor];
  }, [blocks, sequentialCursor]);

  const [submits, setSubmits] = useState<WorkBookSubmitSession["savedAnswers"]>(
    () => {
      return initialSession?.savedAnswers || {};
    },
  );

  const stateRef = useToRef({
    isPending: false,
    blocks,
  });

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
    },
    [],
  );

  const handleSubmit = async () => {
    // if (!submitId) {
    //   alert("세션이 준비되지 않았습니다.");
    //   return;
    // }
    // await fetcher<ReviewWorkBook>(`/api/workbooks/${workBook.id}/submit`, {
    //   method: "POST",
    //   body: JSON.stringify({
    //     submitId,
    //     answer: answers,
    //   }),
    // })
    //   .then((response) => {
    //     if (response) {
    //       setSubmitResult(response);
    //       handleConfetti();
    //     }
    //   })
    //   .catch((error) => {
    //     logger.error("제출 실패:", error);
    //     alert("답안 제출 중 오류가 발생했습니다.");
    //   });
  };

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
          <div>
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
                답안 제출
              </Button>
            </div>
          </div>
        ) : (
          <BlockSequential
            onNext={onNext}
            onPrevious={onPrevious}
            onSubmit={handleSubmit}
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
