"use client";

import {
  BlockAnswerSubmit,
  BlockType,
  checkAnswer,
  initialSubmitAnswer,
  WorkBook,
} from "@service/solves/shared";
import { applyStateUpdate, StateUpdate } from "@workspace/util";

import React, { useCallback, useMemo, useState } from "react";

import { useToRef } from "@/hooks/use-to-ref";

import { cn } from "@/lib/utils";

import { Block } from "./block/block";

import { WorkbookHeader } from "./workbook-header";

export function WorkbookReport({
  book: { blocks, ...workbook },
}: {
  book: WorkBook;
}) {
  const [mode] = useState<"preview" | "solve" | "review">("preview");

  const [submits, setSubmits] = useState<Record<string, BlockAnswerSubmit>>({});

  const correctAnswerIds = useMemo<Record<string, boolean>>(() => {
    if (mode !== "review") return {};
    return blocks.reduce(
      (acc, block) => {
        if (!submits[block.id]) return acc;
        acc[block.id] = checkAnswer(block.answer, submits[block.id]);
        return acc;
      },
      {} as Record<string, boolean>,
    );
  }, [mode]);

  const stateRef = useToRef({
    blocks,
  });

  const handleUpdateSubmitAnswer = useCallback(
    (id: string, answer: StateUpdate<BlockAnswerSubmit<BlockType>>) => {
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
    <div className="h-full relative">
      <div className="h-full overflow-y-auto relative">
        <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-24 pt-6">
          <WorkbookHeader className="shadow-none" mode={mode} book={workbook} />

          {blocks.map((b, index) => {
            return (
              <div
                key={b.id}
                className={cn(
                  "relative transition-all duration-200 rounded-xl border",
                )}
              >
                <Block
                  index={index}
                  className={cn(
                    "border-none",
                    mode == "review" &&
                      !correctAnswerIds[b.id] &&
                      "bg-muted-foreground/5",
                  )}
                  mode={mode}
                  type={b.type}
                  question={b.question ?? ""}
                  id={b.id}
                  submit={submits[b.id]}
                  onUpdateSubmitAnswer={handleUpdateSubmitAnswer.bind(
                    null,
                    b.id,
                  )}
                  order={b.order}
                  isCorrect={correctAnswerIds[b.id]}
                  answer={b.answer}
                  content={b.content}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
