"use client";
import {
  BlockAnswer,
  BlockContent,
  BlockType,
  blockDisplayNames,
  initializeBlock,
  WorkBook,
  WorkBookBlock,
  WorkBookWithoutBlocks,
} from "@service/solves/shared";
import { applyStateUpdate, equal, StateUpdate } from "@workspace/util";
import { PlusIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { processBlocksAction, updateWorkbookAction } from "@/actions/workbook";
import { notify } from "@/components/ui/notify";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToRef } from "@/hooks/use-to-ref";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { GoBackButton } from "../layouts/go-back-button";
import { Button } from "../ui/button";
import { Block } from "./block/block";
import { WorkBookComponentMode } from "./types";
import { WorkbookEditActionBar } from "./workbook-edit-action-bar";
import { WorkbookHeader } from "./workbook-header";

const extractBlockDiff = (prev: WorkBookBlock[], next: WorkBookBlock[]) => {
  const deletedBlocks = prev.filter((b) => !next.includes(b));
  const addedBlocks = next.filter((b) => !prev.includes(b));

  const updatedBlocks = next.filter((b) => {
    const prevBlock = prev.find((pb) => pb.id === b.id);
    return prevBlock && !equal(b, prevBlock);
  });
  return { deletedBlocks, addedBlocks, updatedBlocks };
};

export function WorkbookEdit({
  book: { blocks: initialBlocks, ...initialWorkbook },
}: {
  book: WorkBook;
}) {
  const [snapshot, setSnapshot] = useState<WorkBook>({
    ...initialWorkbook,
    blocks: initialBlocks,
  });
  const [workbook, setWorkbook] =
    useState<WorkBookWithoutBlocks>(initialWorkbook);

  const [blocks, setBlocks] = useState<WorkBookBlock[]>(initialBlocks);

  const [isEditBook, setIsEditBook] = useState(false);

  const [editingBlockId, setEditingBlockId] = useState<string[]>([]);

  const [, updateWorkbook, isBookPending] = useSafeAction(
    updateWorkbookAction,
    {
      onSuccess: () => {
        setSnapshot((prev) => ({ ...prev, ...workbook }));
      },
      successMessage: "저장이 완료되었습니다.",
      failMessage: "저장에 실패했습니다.",
    },
  );

  const [, processBlocks, isBlocksPending] = useSafeAction(
    processBlocksAction,
    {
      onSuccess: () => {
        setSnapshot((prev) => ({ ...prev, blocks: blocks }));
      },
      successMessage: "저장이 완료되었습니다.",
      failMessage: "저장에 실패했습니다.",
    },
  );

  const isPending = useMemo(
    () => isBookPending || isBlocksPending,
    [isBookPending, isBlocksPending],
  );

  const pendingRef = useToRef(isPending);

  const handleChangeWorkbookMode = useCallback(
    (mode: WorkBookComponentMode) => {
      setIsEditBook(mode === "edit");
    },
    [],
  );

  const handleUpdateContent = useCallback(
    (id: string, content: StateUpdate<BlockContent<BlockType>>) => {
      if (pendingRef.current) return;
      setBlocks((prev) => {
        const nextBlocks = prev.map((original) => {
          const isTarget = original.id === id;
          if (!isTarget) return original;
          return {
            ...original,
            content: applyStateUpdate(original.content, content),
          };
        });

        return nextBlocks;
      });
    },
    [],
  );

  const handleUpdateAnswer = useCallback(
    (id: string, answer: StateUpdate<BlockAnswer<BlockType>>) => {
      if (pendingRef.current) return;
      setBlocks((prev) => {
        const nextBlocks = prev.map((original) => {
          const isTarget = original.id === id;
          if (!isTarget) return original;
          return {
            ...original,
            answer: applyStateUpdate(original.answer!, answer),
          };
        });
        return nextBlocks;
      });
    },
    [],
  );

  const handleChangeTitle = useCallback((title: string) => {
    setWorkbook({ ...workbook, title });
  }, []);
  const handleChangeDescription = useCallback((description: string) => {
    setWorkbook({ ...workbook, description });
  }, []);

  const handleUpdateQuestion = useCallback((id: string, question: string) => {
    if (pendingRef.current) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, question } : b)),
    );
  }, []);
  const handleToggleEditMode = useCallback((id: string) => {
    if (pendingRef.current) return;
    setEditingBlockId((prev) => {
      if (prev.includes(id)) {
        return prev.filter((id) => id !== id);
      }
      return Array.from(new Set([...prev, id]));
    });
  }, []);

  const handleDeleteBlock = useCallback((id: string) => {
    if (pendingRef.current) return;
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setEditingBlockId((prev) => prev.filter((id) => id !== id));
  }, []);

  const handleAddBlock = useCallback(async () => {
    if (pendingRef.current) return;
    const addBlock = async (type: BlockType) => {
      const newBlock = initializeBlock(type);
      setBlocks((prev) => [...prev, newBlock]);
      setEditingBlockId((prev) => [...prev, newBlock.id]);
    };
    notify.component({
      renderer: ({ close }) => (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            생성할 문제 유형을 선택하세요
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(blockDisplayNames).map(([type, displayName]) => (
              <Button
                key={type}
                variant="outline"
                onClick={() => {
                  addBlock(type as BlockType);
                  close();
                }}
              >
                {displayName}
              </Button>
            ))}
          </div>
        </div>
      ),
    });
  }, []);

  const handleSave = async () => {
    const hasBookDiff = !equal(
      {
        title: workbook.title,
        description: workbook.description,
      },
      {
        title: snapshot.title,
        description: snapshot.description,
      },
    );

    if (hasBookDiff) {
      await updateWorkbook({
        id: workbook.id,
        title: workbook.title,
        description: workbook.description,
      });
    }

    const { deletedBlocks, addedBlocks, updatedBlocks } = extractBlockDiff(
      snapshot.blocks,
      blocks,
    );

    const hasBlockDiff =
      deletedBlocks.length > 0 ||
      addedBlocks.length > 0 ||
      updatedBlocks.length > 0;

    if (hasBlockDiff) {
      await processBlocks({
        workbookId: workbook.id,
        deleteBlocks: deletedBlocks.map((b) => b.id),
        saveBlocks: [...addedBlocks, ...updatedBlocks],
      });
    }
  };

  return (
    <div className="h-full relative">
      <div className="h-full overflow-y-auto relative">
        <div className="sticky top-0 z-10 py-2 bg-background">
          <GoBackButton>처음부터 다시 만들기</GoBackButton>
        </div>
        <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-24 pt-10">
          <WorkbookHeader
            className="shadow-none"
            mode={isEditBook ? "edit" : "preview"}
            onModeChange={handleChangeWorkbookMode}
            onChangeTitle={handleChangeTitle}
            onChangeDescription={handleChangeDescription}
            book={workbook}
          />

          {blocks.map((b) => {
            return (
              <Block
                className={isPending ? "opacity-50" : ""}
                mode={editingBlockId.includes(b.id) ? "edit" : "preview"}
                onToggleEditMode={handleToggleEditMode.bind(null, b.id)}
                key={b.id}
                type={b.type}
                question={b.question ?? ""}
                id={b.id}
                order={b.order}
                answer={b.answer}
                content={b.content}
                onDeleteBlock={handleDeleteBlock.bind(null, b.id)}
                onUpdateContent={handleUpdateContent.bind(null, b.id)}
                onUpdateAnswer={handleUpdateAnswer.bind(null, b.id)}
                onUpdateQuestion={handleUpdateQuestion.bind(null, b.id)}
              />
            );
          })}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={handleAddBlock}
                className="w-full h-24 md:h-40 border-dashed"
              >
                <PlusIcon className="size-10 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>문제 추가</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <WorkbookEditActionBar
        isPending={isPending}
        onAddBlock={handleAddBlock}
        onSave={handleSave}
        onPublish={() => toast.warning("개발중입니다.")}
      />
    </div>
  );
}
