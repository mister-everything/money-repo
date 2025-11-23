"use client";
import {
  BlockAnswer,
  BlockContent,
  BlockType,
  ProbBook,
  WorkbookBlock,
} from "@service/solves/shared";
import { applyStateUpdate, StateUpdate } from "@workspace/util";
import { useCallback, useState } from "react";
import { Block } from "./block/block";
import { BlockComponentMode } from "./block/types";

export function WorkbookEdit({ book }: { book: ProbBook }) {
  const [blocks, setBlocks] = useState<WorkbookBlock[]>(book.blocks);

  const [mode, setMode] = useState<BlockComponentMode>("preview");

  const handleUpdateContent = useCallback(
    (id: string, content: StateUpdate<BlockContent<BlockType>>) => {
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                content: applyStateUpdate(b.content, content),
              }
            : b,
        ),
      );
    },
    [],
  );

  const handleUpdateAnswer = useCallback(
    (id: string, answer: StateUpdate<BlockAnswer<BlockType>>) => {
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === id
            ? { ...b, answer: applyStateUpdate(b.answer!, answer) }
            : b,
        ),
      );
    },
    [],
  );

  const handleUpdateQuestion = useCallback((id: string, question: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, question } : b)),
    );
  }, []);

  return (
    <div className="flex flex-col gap-6 p-8 max-w-3xl">
      {blocks.map((b) => {
        return (
          <Block
            mode={mode}
            onChangeMode={setMode}
            key={b.id}
            type={b.type}
            question={b.question ?? ""}
            id={b.id}
            order={b.order}
            answer={b.answer}
            content={b.content}
            onUpdateContent={handleUpdateContent.bind(null, b.id)}
            onUpdateAnswer={handleUpdateAnswer.bind(null, b.id)}
            onUpdateQuestion={handleUpdateQuestion.bind(null, b.id)}
          />
        );
      })}
    </div>
  );
}
