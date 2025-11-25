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
import { LoaderIcon, PlusIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { processBlocksAction, updateWorkbookAction } from "@/actions/workbook";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/components/ui/notify";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToRef } from "@/hooks/use-to-ref";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { Button } from "../ui/button";
import { DialogClose } from "../ui/dialog";
import { Block } from "./block/block";

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

  const [editingBlockId, setEditingBlockId] = useState<string[]>([]);

  const [, updateWorkbook, isBookPending] = useSafeAction(
    updateWorkbookAction,
    {
      onSuccess: () => {
        setSnapshot((prev) => ({ ...prev, ...workbook }));
      },
      successMessage: "문제집 정보가 성공적으로 업데이트되었습니다.",
      failMessage: "문제집 정보 업데이트에 실패했습니다.",
    },
  );

  const [, processBlocks, isBlocksPending] = useSafeAction(
    processBlocksAction,
    {
      onSuccess: () => {
        setSnapshot((prev) => ({ ...prev, blocks: blocks }));
      },
      successMessage: "문제 정보가 성공적으로 업데이트되었습니다.",
      failMessage: "문제 정보 업데이트에 실패했습니다.",
    },
  );

  const isPending = useMemo(
    () => isBookPending || isBlocksPending,
    [isBookPending, isBlocksPending],
  );

  const pendingRef = useToRef(isPending);

  const handleUpdateContent = useCallback(
    (id: string, content: StateUpdate<BlockContent<BlockType>>) => {
      if (pendingRef.current) return;
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
      if (pendingRef.current) return;
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
      children: (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            생성할 문제 유형을 선택하세요
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(blockDisplayNames).map(([type, displayName]) => (
              <DialogClose key={type} asChild>
                <Button
                  key={type}
                  variant="outline"
                  onClick={() => addBlock(type as BlockType)}
                >
                  {displayName}
                </Button>
              </DialogClose>
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

    const deletedBlocks = snapshot.blocks.filter((b) => !blocks.includes(b));
    const addedBlocks = blocks.filter((b) => !snapshot.blocks.includes(b));
    const updatedBlocks = blocks.filter((b) => {
      const snapshotBlock = snapshot.blocks.find((sb) => sb.id === b.id);
      return snapshotBlock && !equal(b, snapshotBlock);
    });
    if (
      deletedBlocks.length > 0 ||
      addedBlocks.length > 0 ||
      updatedBlocks.length > 0
    ) {
      await processBlocks({
        workbookId: workbook.id,
        deleteBlocks: deletedBlocks.map((b) => b.id),
        saveBlocks: [...addedBlocks, ...updatedBlocks],
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">문제집 제목</Label>
          <Input
            id="title"
            value={workbook.title}
            placeholder="문제집 제목을 입력하세요"
            onChange={(e) =>
              setWorkbook({ ...workbook, title: e.target.value })
            }
          />
          <Label htmlFor="description">문제집 한줄 설명</Label>
          <Textarea
            id="description"
            value={workbook.description ?? ""}
            className="resize-none max-h-[100px]"
            placeholder="문제집 설명을 입력하세요"
            onChange={(e) =>
              setWorkbook({ ...workbook, description: e.target.value })
            }
          />
          <Button disabled={isPending} onClick={handleSave}>
            {isPending ? <LoaderIcon className="size-4 animate-spin" /> : null}
            저장
          </Button>
        </div>
      </div>

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
            className="w-full h-24 md:h-32"
          >
            <PlusIcon className="size-10 text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>문제 추가</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
