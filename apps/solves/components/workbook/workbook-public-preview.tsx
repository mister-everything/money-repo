"use client";

import {
  BlockAnswerSubmit,
  initialSubmitAnswer,
  WorkBookWithoutAnswer,
} from "@service/solves/shared";
import { applyStateUpdate, StateUpdate } from "@workspace/util";
import { useCallback, useState } from "react";
import { WorkbookSolveNavigateButton } from "@/app/(main)/workbooks/[id]/preview/workbook-solve-navigate-button";

import { Block } from "./block/block";
import { WorkbookHeader } from "./workbook-header";

export function WorkbookPublicPreview({
  book: { blocks, ...workbook },
}: {
  book: WorkBookWithoutAnswer;
}) {
  const [submits, setSubmits] = useState<Record<string, BlockAnswerSubmit>>({});

  const updateSubmit = useCallback(
    (id: string, answer: StateUpdate<BlockAnswerSubmit>) => {
      setSubmits((prev) => {
        const nextSubmits = { ...prev };
        nextSubmits[id] = applyStateUpdate(
          initialSubmitAnswer(
            blocks.find((b) => b.id === id)?.type ?? "default",
          ),
          answer,
        );
        return nextSubmits;
      });
    },
    [],
  );

  return (
    <div className="h-full relative ">
      <div className="h-2/3 pointer-events-none absolute left-0 bottom-0 w-full bg-linear-to-b from-transparent via-background/60 to-background z-10 flex flex-col items-center justify-end gap-4">
        <WorkbookSolveNavigateButton workBookId={workbook.id} />
      </div>
      <div className="h-full overflow-y-auto relative px-4">
        <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-24 pt-6">
          <WorkbookHeader
            className="shadow-none"
            mode={"solve"}
            book={workbook}
          />

          {blocks.slice(0, 3).map((b, index) => {
            return (
              <Block
                key={b.id}
                index={index}
                mode={"solve"}
                type={b.type}
                question={b.question ?? ""}
                submit={submits[b.id]}
                onUpdateSubmitAnswer={updateSubmit.bind(null, b.id)}
                id={b.id}
                order={b.order}
                content={b.content}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
