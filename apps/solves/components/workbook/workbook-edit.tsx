"use client";

import {
  BlockAnswer,
  BlockAnswerSubmit,
  BlockContent,
  BlockType,
  blockValidate,
  CategoryTree,
  checkAnswer,
  initializeBlock,
  initialSubmitAnswer,
  UpdateBlock,
  WorkBook,
  WorkBookBlock,
  WorkBookWithoutBlocks,
} from "@service/solves/shared";
import {
  applyStateUpdate,
  arrayToObject,
  deduplicate,
  equal,
  isNull,
  objectFlow,
  StateUpdate,
} from "@workspace/util";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  PlusIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  processUpdateBlocksAction,
  publishWorkbookAction,
  updateWorkbookAction,
} from "@/actions/workbook";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/notify";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCategories } from "@/hooks/query/use-categories";
import { useToRef } from "@/hooks/use-to-ref";
import { MAX_BLOCK_COUNT } from "@/lib/const";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";
import { useWorkbookEditStore } from "@/store/workbook-edit-store";
import { Skeleton } from "../ui/skeleton";
import { Block } from "./block/block";
import { BlockSelectPopup } from "./block/block-select-popup";
import { WorkBookComponentMode } from "./types";
import { WorkBookCategoryUpdatePopup } from "./workbook-category-update-popup";
import { WorkbookEditActionBar } from "./workbook-edit-action-bar";
import { WorkbookHeader } from "./workbook-header";
import { WorkbookPublishPopup } from "./workbook-publish-popup";

const extractBlockDiff = (prev: WorkBookBlock[], next: WorkBookBlock[]) => {
  const prevBlockById = arrayToObject(prev, (v) => v.id);
  const nextBlockById = arrayToObject(next, (v) => v.id);
  const deletedBlocks = prev.filter((b) => !nextBlockById[b.id]);
  const addedBlocks = next.filter((b) => !prevBlockById[b.id]);

  const updatedBlocks = next
    .filter((b) => {
      const prevBlock = prevBlockById[b.id];
      return prevBlock && !equal(b, prevBlock);
    })
    .map((b) => {
      const updatePayload: UpdateBlock = {
        id: b.id,
      };
      const diffCheckKeys = ["question", "content", "answer", "order"];
      diffCheckKeys.forEach((key) => {
        const oldValue = prevBlockById[b.id][key];
        const newValue = b[key];
        if (oldValue !== newValue) {
          updatePayload[key] = newValue;
        }
      });
      return updatePayload;
    });

  return { deletedBlocks, addedBlocks, updatedBlocks };
};

export function WorkbookEdit({
  book: initialWorkbook,
  blocks: initialBlocks,
}: {
  book: WorkBookWithoutBlocks;
  blocks: WorkBookBlock[];
}) {
  const [snapshot, setSnapshot] = useState<WorkBook>({
    ...initialWorkbook,
    blocks: initialBlocks,
  });

  const {
    blocks = initialBlocks,
    workBook = initialWorkbook,
    focusBlockId,
    appendBlock,
    setBlocks,
    setWorkBook,
  } = useWorkbookEditStore();

  const ref = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const [isEditBook, setIsEditBook] = useState(false);

  const [editingBlockId, setEditingBlockId] = useState<string[]>([]);

  const [isReorderMode, setIsReorderMode] = useState(false);

  const [control, setControl] = useState<"edit" | "solve" | "review">("edit");

  const [submits, setSubmits] = useState<Record<string, BlockAnswerSubmit>>({});

  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);

  const [isPublishPopupOpen, setIsPublishPopupOpen] = useState(false);

  const { data: categories = [], isLoading: isCategoriesLoading } =
    useCategories();

  const correctAnswerIds = useMemo<Record<string, boolean>>(() => {
    if (control !== "review") return {};

    const result = blocks.reduce(
      (acc, block) => {
        if (!submits[block.id]) return acc;
        acc[block.id] = checkAnswer(block.answer, submits[block.id]);
        return acc;
      },
      {} as Record<string, boolean>,
    );

    return result;
  }, [control]);

  const [, updateWorkbook, isBookPending] = useSafeAction(
    updateWorkbookAction,
    {
      onSuccess: () => {
        setSnapshot((prev) => ({ ...prev, ...workBook }));
      },
    },
  );

  const [, publish, isPublishing] = useSafeAction(publishWorkbookAction, {
    failMessage: "배포에 실패했습니다.",
    successMessage: "발행이 완료되었어요. 화면 이동중",
    onSuccess: () => {
      router.push(`/workbooks/${workBook.id}/report`);
    },
  });

  const [, processUpdateBlocks, isBlocksPending] = useSafeAction(
    processUpdateBlocksAction,
    {
      onSuccess: () => {
        setSnapshot((prev) => ({ ...prev, blocks: blocks }));
      },
    },
  );

  const isPending = useMemo(
    () => isBookPending || isBlocksPending || isPublishing,
    [isBookPending, isBlocksPending, isPublishing],
  );

  const stateRef = useToRef({
    isPending,
    blocks,
    workBook,
  });

  const blocksDiff = useMemo(() => {
    return extractBlockDiff(snapshot.blocks, blocks);
  }, [snapshot.blocks, blocks]);

  const isWorkBookDiff = useMemo(() => {
    return !equal(
      {
        title: workBook.title,
        description: workBook.description,
      },
      {
        title: snapshot.title,
        description: snapshot.description,
      },
    );
  }, [snapshot, workBook]);

  const isBlocksDiff = useMemo(() => {
    const { deletedBlocks, addedBlocks, updatedBlocks } = blocksDiff;
    return (
      deletedBlocks.length > 0 ||
      addedBlocks.length > 0 ||
      updatedBlocks.length > 0
    );
  }, [blocksDiff]);

  const selectedCategory = useMemo(() => {
    const flatCategories = categories.flatMap((c) => [c, ...c.children]);
    const category = flatCategories.find((c) => c.id === workBook.categoryId);
    if (!category) return [];
    if (category.parentId === null) return [category];
    return [
      flatCategories.find((c) => c.id === category.parentId),
      category,
    ].filter(Boolean) as CategoryTree[];
  }, [categories, workBook.categoryId]);

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
    setWorkBook((prev) => ({ ...prev, title }));
  }, []);
  const handleChangeDescription = useCallback((description: string) => {
    setWorkBook((prev) => ({ ...prev, description }));
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
    setBlocks((prev) =>
      prev
        .filter((b) => b.id !== id)
        .map((b, i) => {
          if ((b.order = i)) return b;
          return {
            ...b,
            order: i,
          };
        }),
    );
    setEditingBlockId((prev) => prev.filter((id) => id !== id));
  }, []);

  const handleAddBlock = useCallback(async (blockType: BlockType) => {
    if (stateRef.current.isPending) return;
    if (stateRef.current.blocks.length >= MAX_BLOCK_COUNT) {
      toast.warning(`문제는 최대 ${MAX_BLOCK_COUNT}개까지 입니다.`);
      return;
    }
    const newBlock = initializeBlock(blockType);
    appendBlock(newBlock);
    setEditingBlockId([newBlock.id]);
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
    if (isWorkBookDiff) {
      await updateWorkbook({
        id: workBook.id,
        title: workBook.title,
        description: workBook.description || "",
      });
    }

    if (isBlocksDiff) {
      const { deletedBlocks, addedBlocks, updatedBlocks } = blocksDiff;
      await processUpdateBlocks({
        workbookId: workBook.id,
        deleteBlocks: deletedBlocks.map((b) => b.id),
        insertBlocks: addedBlocks,
        updateBlocks: updatedBlocks,
      });
    }
  };

  const handleGoBack = useCallback(async () => {
    if (isWorkBookDiff || isBlocksDiff) {
      const answer = await notify.confirm({
        title: "저장되지 않은 변경사항이 있습니다.",
        description: "저장하지 않고 이전 페이지로 이동하시겠습니까?",
        okText: "뒤로가기",
        cancelText: "취소",
      });
      if (!answer) return;
    }
    router.back();
  }, [router, isWorkBookDiff, isBlocksDiff]);

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
        const result = blockValidate(b);
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

  const validateWorkbook = useCallback((): true | string => {
    if (stateRef.current.blocks.length === 0) {
      ref.current?.scrollTo({ top: 0, behavior: "smooth" });
      return "문제를 최소 1개 이상 추가해주세요.";
    }
    if (!stateRef.current.workBook.title?.trim?.()) {
      setIsEditBook(true);
      ref.current?.scrollTo({ top: 0, behavior: "smooth" });
      return "문제집 제목을 입력해주세요.";
    }
    if (!stateRef.current.workBook.description?.trim?.()) {
      setIsEditBook(true);
      ref.current?.scrollTo({ top: 0, behavior: "smooth" });
      return "문제집 설명을 입력해주세요.";
    }
    const isValid = handleValidateBlocks(stateRef.current.blocks);
    if (!isValid) {
      ref.current?.scrollTo({ top: 0, behavior: "smooth" });
      return "문제를 먼저 수정해주세요.";
    }
    return true;
  }, []);

  const handleOpenPublishPopup = useCallback(() => {
    const result = validateWorkbook();
    if (result !== true) {
      toast.warning(result);
      ref.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setIsPublishPopupOpen(true);
  }, []);

  const handlePublish = useCallback(
    async (tags: string[]) => {
      await handleSave();
      publish({ workBookId: workBook.id, tags });
      setIsPublishPopupOpen(false);
    },
    [publish, workBook.id],
  );

  useEffect(() => {
    setWorkBook(initialWorkbook);
  }, [initialWorkbook]);
  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks]);

  return (
    <div className="h-full relative">
      <div ref={ref} className="h-full overflow-y-auto relative">
        <div className="sticky top-0 z-10 py-2 backdrop-blur-sm flex items-center gap-2">
          <Button variant="ghost" onClick={handleGoBack} disabled={isPending}>
            <ChevronLeftIcon className="size-4!" />
            뒤로가기
          </Button>
          <div className="flex-1" />

          {isCategoriesLoading ? (
            <Skeleton className="w-24 h-9 rounded-full " />
          ) : isNull(workBook.categoryId) ? (
            <>
              <WorkBookCategoryUpdatePopup
                workBookId={workBook.id}
                onSavedCategory={(categoryId) => {
                  setWorkBook((prev) => ({ ...prev, categoryId }));
                }}
              >
                <Button className="rounded-full text-xs">소재 선택</Button>
              </WorkBookCategoryUpdatePopup>
            </>
          ) : (
            selectedCategory.length > 0 && (
              <Button className="rounded-full text-xs">
                {selectedCategory.map((c, i) => {
                  if (i == 0) return <Fragment key={i}>{c.name}</Fragment>;
                  return (
                    <Fragment key={i}>
                      <ChevronRightIcon className="size-3.5" />
                      {c.name}
                    </Fragment>
                  );
                })}
              </Button>
            )
          )}
        </div>
        <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-24 pt-6">
          <WorkbookHeader
            className="shadow-none"
            mode={control != "edit" ? "solve" : isEditBook ? "edit" : "preview"}
            onModeChange={handleChangeWorkbookMode}
            onChangeTitle={handleChangeTitle}
            onChangeDescription={handleChangeDescription}
            book={workBook}
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
                key={`${b.id}-${mode}`}
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
          const result = validateWorkbook();
          if (result !== true) {
            toast.warning(result);
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
