"use client";
import {
  BlockAnswer,
  BlockContent,
  BlockType,
  WorkBook,
  WorkBookBlock,
} from "@service/solves/shared";
import { applyStateUpdate, StateUpdate } from "@workspace/util";
import { useCallback, useState } from "react";
import { Block } from "./block/block";

export function WorkbookEdit({
  initialWorkbook,
}: {
  initialWorkbook: WorkBook;
}) {
  const [blocks, setBlocks] = useState<WorkBookBlock[]>(initialWorkbook.blocks);

  const [editingBlockId, setEditingBlockId] = useState<string[]>([]);

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
  const handleToggleEditMode = useCallback((id: string) => {
    setEditingBlockId((prev) => {
      if (prev.includes(id)) {
        return prev.filter((id) => id !== id);
      }
      return Array.from(new Set([...prev, id]));
    });
  }, []);

  return (
    <div className="flex flex-col gap-6 p-8 max-w-3xl">
      {blocks.map((b) => {
        return (
          <Block
            mode={editingBlockId.includes(b.id) ? "edit" : "preview"}
            onToggleEditMode={handleToggleEditMode.bind(null, b.id)}
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
