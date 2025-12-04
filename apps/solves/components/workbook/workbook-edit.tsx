"use client";

import {
  BlockAnswer,
  BlockAnswerSubmit,
  BlockContent,
  BlockType,
  checkAnswer,
  initializeBlock,
  initialSubmitAnswer,
  validateBlock,
  WorkBook,
  WorkBookBlock,
  WorkBookWithoutBlocks,
} from "@service/solves/shared";
import {
  applyStateUpdate,
  deduplicate,
  equal,
  objectFlow,
  StateUpdate,
} from "@workspace/util";
import { GripVerticalIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  processUpdateBlocksAction,
  publishWorkbookAction,
  updateWorkbookAction,
} from "@/actions/workbook";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToRef } from "@/hooks/use-to-ref";
import { MAX_BLOCK_COUNT } from "@/lib/const";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";
import { GoBackButton } from "../layouts/go-back-button";
import { Block } from "./block/block";
import { BlockSelectPopup } from "./block/block-select-popup";
import { WorkBookComponentMode } from "./types";
import { WorkbookEditActionBar } from "./workbook-edit-action-bar";
import { WorkbookHeader } from "./workbook-header";
import { WorkbookPublishPopup } from "./workbook-publish-popup";

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

  const ref = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const [blocks, setBlocks] = useState<WorkBookBlock[]>(initialBlocks);

  const [isEditBook, setIsEditBook] = useState(false);

  const [editingBlockId, setEditingBlockId] = useState<string[]>([]);

  const [isReorderMode, setIsReorderMode] = useState(false);

  const [control, setControl] = useState<"edit" | "solve" | "review">("edit");

  const [submits, setSubmits] = useState<Record<string, BlockAnswerSubmit>>({});

  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);

  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);

  const [isPublishPopupOpen, setIsPublishPopupOpen] = useState(false);

  const correctAnswerIds = useMemo<Record<string, boolean>>(() => {
    if (control !== "review") return {};
    return blocks.reduce(
      (acc, block) => {
        if (!submits[block.id]) return acc;
        acc[block.id] = checkAnswer(block.answer, submits[block.id]);
        return acc;
      },
      {} as Record<string, boolean>,
    );
  }, [control]);

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

  const [, publish, isPublishing] = useSafeAction(publishWorkbookAction, {
    failMessage: "배포에 실패했습니다.",
    successMessage: "발행이 완료되었어요. 화면 이동중",
    onSuccess: () => {
      router.push(`/workbooks/${workbook.id}/preview`);
    },
  });

  const [, processUpdateBlocks, isBlocksPending] = useSafeAction(
    processUpdateBlocksAction,
    {
      onSuccess: () => {
        setSnapshot((prev) => ({ ...prev, blocks: blocks }));
      },
      successMessage: "저장이 완료되었습니다.",
      failMessage: "저장에 실패했습니다.",
    },
  );

  const isPending = useMemo(
    () => isBookPending || isBlocksPending || isPublishing,
    [isBookPending, isBlocksPending, isPublishing],
  );

  const stateRef = useToRef({
    isPending,
    blocks,
  });

  const handleChangeWorkbookMode = useCallback(
    (mode: WorkBookComponentMode) => {
      setIsEditBook(mode === "edit");
    },
    [],
  );

  const handleUpdateContent = useCallback(
    (id: string, content: StateUpdate<BlockContent<BlockType>>) => {
      if (stateRef.current.isPending) return;
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
      if (stateRef.current.isPending) return;
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

  const handleUpdateSolution = useCallback(
    (id: string, solution: string) => {
      handleUpdateAnswer(id, { solution });
    },
    [handleUpdateAnswer],
  );

  const handleChangeTitle = useCallback((title: string) => {
    setWorkbook({ ...workbook, title });
  }, []);
  const handleChangeDescription = useCallback((description: string) => {
    setWorkbook({ ...workbook, description });
  }, []);

  const deleteFeedback = useCallback((id: string) => {
    setFeedbacks((prev) => objectFlow(prev).filter((_, key) => key !== id));
  }, []);

  const handleUpdateQuestion = useCallback((id: string, question: string) => {
    if (stateRef.current.isPending) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, question } : b)),
    );
  }, []);
  const handleToggleEditMode = useCallback((id: string) => {
    if (stateRef.current.isPending) return;
    deleteFeedback(id);
    setEditingBlockId((prev) => {
      if (prev.includes(id)) {
        return prev.filter((id) => id !== id);
      }
      return Array.from(new Set([...prev, id]));
    });
  }, []);

  const handleDeleteBlock = useCallback((id: string) => {
    if (stateRef.current.isPending) return;
    deleteFeedback(id);
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setEditingBlockId((prev) => prev.filter((id) => id !== id));
  }, []);

  const handleAddBlock = useCallback(async (blockType: BlockType) => {
    if (stateRef.current.isPending) return;
    if (stateRef.current.blocks.length >= MAX_BLOCK_COUNT) {
      toast.warning(`문제는 최대 ${MAX_BLOCK_COUNT}개까지 입니다.`);
      return;
    }
    const newBlock = initializeBlock(blockType);
    setBlocks((prev) => {
      const maxOrder = Math.max(...prev.map((b) => b.order), 0);
      const newBlocks = [
        ...prev,
        {
          ...newBlock,
          order: maxOrder + 1,
        },
      ];
      return newBlocks;
    });
    setFocusBlockId(newBlock.id);
    setEditingBlockId((prev) => [...prev, newBlock.id]);
  }, []);

  const handleFocusBlock = useCallback((node: HTMLDivElement) => {
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const handleToggleReorderMode = useCallback(() => {
    setIsReorderMode((prev) => !prev);
    setDraggedBlockId(null);
    setDragOverBlockId(null);
  }, []);

  const handleReorderDragStart = useCallback(
    (e: React.DragEvent, blockId: string) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", blockId);
      setDraggedBlockId(blockId);
    },
    [],
  );

  const handleReorderDragOver = useCallback(
    (e: React.DragEvent, blockId: string) => {
      e.preventDefault();
      if (draggedBlockId && draggedBlockId !== blockId) {
        setDragOverBlockId(blockId);
      }
    },
    [draggedBlockId],
  );

  const handleReorderDragLeave = useCallback(() => {
    setDragOverBlockId(null);
  }, []);

  const handleReorderDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!draggedBlockId || draggedBlockId === targetId) {
        setDragOverBlockId(null);
        return;
      }
      setBlocks((prev) => {
        const draggedIndex = prev.findIndex((b) => b.id === draggedBlockId);
        const targetIndex = prev.findIndex((b) => b.id === targetId);
        if (draggedIndex === -1 || targetIndex === -1) return prev;
        const newBlocks = [...prev];
        const [removed] = newBlocks.splice(draggedIndex, 1);
        newBlocks.splice(targetIndex, 0, removed);
        return newBlocks.map((b, index) => ({ ...b, order: index }));
      });
      setDraggedBlockId(null);
      setDragOverBlockId(null);
    },
    [draggedBlockId],
  );

  const handleReorderDragEnd = useCallback(() => {
    setDraggedBlockId(null);
    setDragOverBlockId(null);
  }, []);

  const handleUpdateSubmitAnswer = useCallback(
    (id: string, answer: StateUpdate<BlockAnswerSubmit<BlockType>>) => {
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
        description: workbook.description || "",
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
      await processUpdateBlocks({
        workbookId: workbook.id,
        deleteBlocks: deletedBlocks.map((b) => b.id),
        saveBlocks: [...addedBlocks, ...updatedBlocks],
      });
    }
  };

  const handleChangeControl = useCallback(
    (mode: "edit" | "solve" | "review") => {
      if (mode !== "review") {
        setSubmits({});
      }
      ref.current?.scrollTo({ top: 0, behavior: "smooth" });
      setControl(mode);
    },
    [],
  );

  const handleValidateBlocks = useCallback((blocks: WorkBookBlock[]) => {
    const nextFeedbacks = blocks.reduce(
      (acc, b) => {
        const result = validateBlock(b);
        if (!result.success) {
          const errors = Object.values(result.errors ?? {}).flat();
          acc[b.id] = deduplicate(errors).join("\n");
        }
        return acc;
      },
      {} as Record<string, string>,
    );
    setFeedbacks(nextFeedbacks);
    if (Object.keys(nextFeedbacks).length > 0) {
      return false;
    }
    return true;
  }, []);

  const handleOpenPublishPopup = useCallback(() => {
    if (stateRef.current.blocks.length === 0) {
      toast.warning("문제를 최소 1개 이상 추가해주세요.");
      ref.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const isValid = handleValidateBlocks(stateRef.current.blocks);
    if (!isValid) {
      toast.warning("문제를 먼저 수정해주세요.");
      ref.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setIsPublishPopupOpen(true);
  }, []);

  const handlePublish = useCallback(
    async (tags: string[]) => {
      await handleSave();
      publish({ workBookId: workbook.id, tags });
      setIsPublishPopupOpen(false);
    },
    [publish, workbook.id],
  );

  return (
    <div className="h-full relative">
      <div ref={ref} className="h-full overflow-y-auto relative">
        <div className="sticky top-0 z-10 py-2 bg-background flex items-center gap-2">
          <GoBackButton>처음부터 다시 만들기</GoBackButton>
          <div className="flex-1" />
          <Button className="rounded-full">임시 소제</Button>
          <Button className="rounded-full">임시 소제 {">"} 소재</Button>
        </div>
        <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-24 pt-6">
          <WorkbookHeader
            className="shadow-none"
            mode={control != "edit" ? "solve" : isEditBook ? "edit" : "preview"}
            onModeChange={handleChangeWorkbookMode}
            onChangeTitle={handleChangeTitle}
            onChangeDescription={handleChangeDescription}
            book={workbook}
          />

          {blocks.map((b, index) => {
            const isDragOver = dragOverBlockId === b.id;
            const mode =
              control !== "edit"
                ? control
                : editingBlockId.includes(b.id)
                  ? "edit"
                  : "preview";
            return (
              <div
                key={b.id}
                className={cn(
                  "relative transition-all duration-200 rounded-xl border",
                  isReorderMode &&
                    "cursor-grab active:cursor-grabbing hover:border-primary/50 overflow-hidden max-h-80",
                  isDragOver &&
                    "border-muted-foreground bg-seborder-muted-foreground border-dashed",
                )}
                draggable={isReorderMode}
                onDragStart={(e) =>
                  isReorderMode && handleReorderDragStart(e, b.id)
                }
                onDragOver={(e) =>
                  isReorderMode && handleReorderDragOver(e, b.id)
                }
                onDragLeave={isReorderMode ? handleReorderDragLeave : undefined}
                onDrop={(e) => isReorderMode && handleReorderDrop(e, b.id)}
                onDragEnd={isReorderMode ? handleReorderDragEnd : undefined}
              >
                {isReorderMode && !isDragOver && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl transition-colors bg-muted/40 hover:bg-primary/10 backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <GripVerticalIcon className="size-6" />
                      <span className="text-sm font-medium">
                        드래그하여 이동
                      </span>
                    </div>
                  </div>
                )}
                <Block
                  index={index}
                  isPending={isPending}
                  ref={focusBlockId === b.id ? handleFocusBlock : undefined}
                  className={cn(
                    "border-none",
                    isPending ? "opacity-50" : "",
                    mode == "review" &&
                      !correctAnswerIds[b.id] &&
                      "bg-muted-foreground/5",
                  )}
                  mode={mode}
                  onToggleEditMode={handleToggleEditMode.bind(null, b.id)}
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
                  onUpdateSolution={handleUpdateSolution.bind(null, b.id)}
                  onDeleteBlock={handleDeleteBlock.bind(null, b.id)}
                  onUpdateContent={handleUpdateContent.bind(null, b.id)}
                  onUpdateAnswer={handleUpdateAnswer.bind(null, b.id)}
                  onUpdateQuestion={handleUpdateQuestion.bind(null, b.id)}
                  errorFeedback={feedbacks[b.id]}
                />
              </div>
            );
          })}
          {control === "edit" &&
            stateRef.current.blocks.length < MAX_BLOCK_COUNT && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <BlockSelectPopup onSelected={handleAddBlock}>
                      <Button
                        variant="outline"
                        className="w-full h-16 md:h-28 border-dashed"
                      >
                        <PlusIcon className="size-10 text-muted-foreground" />
                      </Button>
                    </BlockSelectPopup>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <span>문제 추가</span>
                </TooltipContent>
              </Tooltip>
            )}
          {control !== "edit" && (
            <Button
              size={"lg"}
              onClick={() =>
                handleChangeControl(control === "solve" ? "review" : "solve")
              }
            >
              {control === "solve" ? "체점" : "다시 풀기"}
            </Button>
          )}
        </div>
      </div>

      <WorkbookEditActionBar
        isPending={isPending}
        isReorderMode={isReorderMode}
        isSolveMode={control != "edit"}
        isMaxBlockCount={blocks.length >= MAX_BLOCK_COUNT}
        onToggleSolveMode={() => {
          if (control === "solve") {
            return handleChangeControl("edit");
          }
          const isValid = handleValidateBlocks(blocks);
          if (!isValid) {
            toast.warning("문제를 먼저 수정해주세요.");
            ref.current?.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
          handleChangeControl(control == "edit" ? "solve" : "edit");
        }}
        onAddBlock={handleAddBlock}
        onSave={handleSave}
        onPublish={handleOpenPublishPopup}
        onToggleReorderMode={handleToggleReorderMode}
      />

      <WorkbookPublishPopup
        open={isPublishPopupOpen}
        onOpenChange={setIsPublishPopupOpen}
        onPublish={handlePublish}
        isPending={isPublishing}
      />
    </div>
  );
}
