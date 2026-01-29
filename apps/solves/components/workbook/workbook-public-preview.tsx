"use client";

import {
  BlockAnswerSubmit,
  initialSubmitAnswer,
  WorkBookWithoutAnswer,
} from "@service/solves/shared";
import { applyStateUpdate, StateUpdate } from "@workspace/util";
import { useCallback, useState } from "react";
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
        const block = blocks.find((b) => b.id === id);
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
    <div className="flex flex-col gap-6">
      <WorkbookHeader className="shadow-none" mode={"solve"} book={workbook} />

      {blocks.slice(0, 3).map((b, index) => {
        return (
          <div key={b.id} className="relative">
            <Block
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
          </div>
        );
      })}
      {blocks.length > 3 && (
        <div className="flex justify-center mt-8 mb-44">
          외 {blocks.length - 3}개 문제가 더 있습니다.
        </div>
      )}
    </div>
  );
}
