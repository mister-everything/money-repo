"use client";
import {
  BlockAnswer,
  BlockAnswerSubmit,
  BlockContent,
  BlockType,
} from "@service/solves/shared";
import { deduplicate, generateUUID, StateUpdate } from "@workspace/util";
import { CircleIcon, PlusIcon, XIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InDevelopment } from "@/components/ui/in-development";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/components/ui/notify";
import { cn } from "@/lib/utils";
import { WorkBookComponentMode } from "../types";

// 사용자가 선택했고 정답 일때
const okClass = "border-primary bg-primary/5 text-primary hover:text-primary";

// 문제를 풀때 선택한 것 일단 ok 랑 동일하게
const selectClass =
  "border-primary bg-primary/5 text-primary hover:text-primary";

// 사용자가 선택했고 오답 일때
// 수민이한테 한번 더 물어보기 너무 빨간게 부정적일수도
const failClass = "border-destructive bg-destructive/5 text-destructive";

// 사용자가 선택은 안했지만 (오답제출) 정답일때
const muteCalss = "bg-secondary border-muted-foreground";

type BlockContentProps<T extends BlockType = BlockType> = {
  content: BlockContent<T>;
  mode: WorkBookComponentMode;
  isCorrect?: boolean;
  onUpdateContent?: (content: StateUpdate<BlockContent<T>>) => void;
  onUpdateSubmitAnswer?: (answer: StateUpdate<BlockAnswerSubmit<T>>) => void;
  onUpdateAnswer?: (answer: StateUpdate<BlockAnswer<T>>) => void;
  answer?: BlockAnswer<T>;
  submit?: BlockAnswerSubmit<T>;
};
// 주관식 문제
export function DefaultBlockContent({
  answer,
  submit,
  mode,
  onUpdateAnswer,
  onUpdateSubmitAnswer,
  isCorrect,
}: BlockContentProps<"default">) {
  const handleChangeSubmitAnswer = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (mode == "solve")
        onUpdateSubmitAnswer?.({ answer: e.currentTarget.value.trim() });
    },
    [onUpdateSubmitAnswer, mode],
  );

  const addAnswer = useCallback(async () => {
    const newAnswer = await notify
      .prompt({
        title: "정답 추가",
        description: "답안을 작성하세요",
      })
      .then((answer) => answer.trim());
    if (!newAnswer) return;
    onUpdateAnswer?.((prev) => ({
      ...prev,
      answer: deduplicate([...(prev?.answer || []), newAnswer]),
    }));
  }, [onUpdateAnswer]);

  const removeAnswer = useCallback(
    (index: number) => {
      onUpdateAnswer?.((prev) => ({
        ...prev,
        answer: prev?.answer?.filter((_, i) => i !== index) || [],
      }));
    },
    [onUpdateAnswer],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {(mode == "solve" || mode == "preview") && (
          <Input
            placeholder="답안을 작성하세요"
            className="w-full"
            value={submit?.answer}
            onChange={handleChangeSubmitAnswer}
            disabled={mode == "preview"}
          />
        )}
        {mode == "review" && (
          <div className="text-sm flex flex-col gap-2 text-muted-foreground">
            <Input
              placeholder="정답을 제출하지 않았습니다."
              className="w-full"
              value={submit?.answer}
              disabled
            />
            {!isCorrect && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="pr-2">정답:</span>
                {answer?.answer.map((correctAnswer, index) => (
                  <Badge key={index} variant="secondary">
                    {correctAnswer}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
        {mode == "edit" && (
          <div className="flex flex-wrap items-center gap-2">
            {answer?.answer.map((correctAnswer, index) => (
              <Button
                onClick={() => removeAnswer(index)}
                variant="secondary"
                key={index}
              >
                {correctAnswer}
                <XIcon />
              </Button>
            ))}
            <Button
              onClick={addAnswer}
              variant="outline"
              className="border-dashed"
            >
              <PlusIcon /> 정답 추가
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// 다중 선택 객관식 문제
export function McqMultipleBlockContent({
  answer,
  submit,
  mode,
  content,
  onUpdateAnswer,
  onUpdateContent,
  onUpdateSubmitAnswer,
  isCorrect,
}: BlockContentProps<"mcq-multiple">) {
  const addOption = useCallback(async () => {
    const newAnswer = await notify
      .prompt({
        title: "정답 추가",
        description: "답안을 작성하세요",
      })
      .then((answer) => answer.trim());
    if (!newAnswer) return;
    onUpdateContent?.((prev) => ({
      ...prev,
      options: [
        ...(prev?.options || []),
        {
          id: generateUUID(),
          text: newAnswer,
          type: "text",
        },
      ],
    }));
  }, [onUpdateContent]);

  const removeOption = useCallback(
    (index: number) => {
      onUpdateContent?.((prev) => ({
        ...prev,
        options: prev?.options?.filter((_, i) => i !== index) || [],
      }));
    },
    [onUpdateContent],
  );

  const handleOptionSelect = useCallback(
    (optionId: string) => {
      if (mode == "solve")
        return onUpdateSubmitAnswer?.((prev) => {
          const prevAnswer = prev?.answer ?? [];
          const hasOption = prevAnswer?.includes(optionId);
          return {
            answer: hasOption
              ? prevAnswer?.filter((id) => id !== optionId)
              : [...prevAnswer, optionId],
          };
        });
      if (mode == "edit")
        return onUpdateAnswer?.((prev) => {
          const prevAnswer = prev?.answer ?? [];
          const hasOption = prevAnswer?.includes(optionId);
          return {
            ...prev,
            answer: hasOption
              ? prevAnswer?.filter((id) => id !== optionId)
              : [...prevAnswer, optionId],
          };
        });
    },
    [onUpdateAnswer, mode, onUpdateSubmitAnswer],
  );

  const getChecked = useCallback(
    (optionId: string) => {
      if (mode == "solve") return submit?.answer?.includes(optionId);
      if (mode == "edit") return answer?.answer.includes(optionId);
      return false;
    },
    [mode, answer, submit],
  );

  const getSelectedClass = useCallback(
    (optionId: string) => {
      if (mode == "solve")
        return submit?.answer?.includes(optionId) ? selectClass : "";
      if (mode == "edit")
        return answer?.answer.includes(optionId) ? okClass : "";
      if (mode == "review") {
        if (isCorrect) return answer?.answer.includes(optionId) ? okClass : "";
        if (submit?.answer?.includes(optionId)) return failClass;
        if (answer?.answer.includes(optionId)) return muteCalss;
      }
    },
    [mode, answer, submit],
  );

  return (
    <div className="flex flex-col gap-3">
      {content.options.map((option, index) => {
        if (option.type == "text") {
          const checked = getChecked(option.id);
          return (
            <Label
              key={option.id}
              htmlFor={option.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 transition-colors select-none",
                (mode == "edit" || mode == "solve") && "cursor-pointer",
                getSelectedClass(option.id),
              )}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                <Checkbox
                  id={option.id}
                  checked={checked}
                  onCheckedChange={() => handleOptionSelect(option.id)}
                  className={cn(
                    "mr-2 rounded-sm border-border bg-card",
                    getSelectedClass(option.id) != okClass &&
                      "data-[state=checked]:bg-muted data-[state=checked]:text-muted-foreground",
                  )}
                />

                <span className="text-sm font-medium leading-snug">
                  {option.text}
                </span>
              </div>
              {mode == "edit" && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(index);
                  }}
                  size="icon"
                  className="size-6! text-muted-foreground ml-auto"
                  variant="ghost"
                >
                  <XIcon className="size-3!" />
                </Button>
              )}
            </Label>
          );
        }

        return (
          <InDevelopment key={option.id} className="w-full text-sm h-48">
            아직 지원하지 않는 옵션 입니다.
          </InDevelopment>
        );
      })}
      {mode == "preview" &&
        content.options.length === 0 &&
        Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="w-full h-12 rounded-lg border border-dashed bg-muted-foreground/5"
          />
        ))}
      {mode == "edit" && (
        <Button
          variant="outline"
          size="lg"
          className="border-dashed w-full py-6!"
          onClick={addOption}
        >
          <PlusIcon /> 옵션 추가
        </Button>
      )}
    </div>
  );
}
// 단일 선택 객관식 문제
export function McqSingleBlockContent({
  answer,
  submit,
  mode,
  content,
  onUpdateAnswer,
  onUpdateContent,
  onUpdateSubmitAnswer,
  isCorrect,
}: BlockContentProps<"mcq">) {
  const addOption = useCallback(async () => {
    const newAnswer = await notify
      .prompt({
        title: "정답 추가",
        description: "답안을 작성하세요",
      })
      .then((answer) => answer.trim());
    if (!newAnswer) return;
    onUpdateContent?.((prev) => ({
      ...prev,
      options: [
        ...(prev?.options || []),
        {
          id: generateUUID(),
          text: newAnswer,
          type: "text",
        },
      ],
    }));
  }, [onUpdateContent]);

  const removeOption = useCallback(
    (index: number) => {
      onUpdateContent?.((prev) => ({
        ...prev,
        options: prev?.options?.filter((_, i) => i !== index) || [],
      }));
    },
    [onUpdateContent],
  );

  const handleOptionSelect = useCallback(
    (optionId: string) => {
      if (mode == "solve")
        return onUpdateSubmitAnswer?.({
          answer: optionId,
        });
      if (mode == "edit")
        return onUpdateAnswer?.({
          answer: optionId,
        });
    },
    [onUpdateAnswer, mode, onUpdateSubmitAnswer],
  );

  const getChecked = useCallback(
    (optionId: string) => {
      if (mode == "solve") return submit?.answer?.includes(optionId);
      if (mode == "edit") return answer?.answer.includes(optionId);
      return false;
    },
    [mode, answer, submit],
  );

  const getSelectedClass = useCallback(
    (optionId: string) => {
      if (mode == "solve")
        return submit?.answer?.includes(optionId) ? selectClass : "";
      if (mode == "edit")
        return answer?.answer.includes(optionId) ? okClass : "";
      if (mode == "review") {
        if (isCorrect) return answer?.answer.includes(optionId) ? okClass : "";
        if (submit?.answer?.includes(optionId)) return failClass;
        if (answer?.answer.includes(optionId)) return muteCalss;
      }
    },
    [mode, answer, submit],
  );

  return (
    <div className="flex flex-col gap-3">
      {content.options.map((option, index) => {
        if (option.type == "text") {
          const checked = getChecked(option.id);
          return (
            <Label
              key={option.id}
              htmlFor={option.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 transition-colors select-none",
                (mode == "edit" || mode == "solve") && "cursor-pointer",
                getSelectedClass(option.id),
              )}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                <Checkbox
                  id={option.id}
                  checked={checked}
                  onCheckedChange={() => handleOptionSelect(option.id)}
                  className={cn(
                    "mr-2 rounded-sm border-border bg-card",
                    getSelectedClass(option.id) != okClass &&
                      "data-[state=checked]:bg-muted data-[state=checked]:text-muted-foreground",
                  )}
                />

                <span className="text-sm font-medium leading-snug">
                  {option.text}
                </span>
              </div>
              {mode == "edit" && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(index);
                  }}
                  size="icon"
                  className="size-6! text-muted-foreground ml-auto"
                  variant="ghost"
                >
                  <XIcon className="size-3!" />
                </Button>
              )}
            </Label>
          );
        }

        return (
          <InDevelopment key={option.id} className="w-full text-sm h-48">
            아직 지원하지 않는 옵션 입니다.
          </InDevelopment>
        );
      })}
      {mode == "preview" &&
        content.options.length === 0 &&
        Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="w-full h-12 rounded-lg border border-dashed bg-muted-foreground/5"
          />
        ))}
      {mode == "edit" && (
        <Button
          variant="outline"
          size="lg"
          className="border-dashed w-full py-6!"
          onClick={addOption}
        >
          <PlusIcon /> 옵션 추가
        </Button>
      )}
    </div>
  );
}

// OX 문제
export function OXBlockContent({
  onUpdateSubmitAnswer,
  onUpdateAnswer,
  mode,
  answer,
  isCorrect,
  submit,
}: BlockContentProps<"ox">) {
  const handleClick = useCallback(
    (value: boolean) => {
      if (mode == "solve") {
        return onUpdateSubmitAnswer?.({
          answer: value,
        });
      }

      if (mode == "edit") {
        return onUpdateAnswer?.({
          answer: value,
        });
      }
    },
    [mode, onUpdateSubmitAnswer, onUpdateAnswer],
  );

  const getSelectedClass = useCallback(
    (value: boolean) => {
      if (mode == "solve") {
        return submit?.answer === value ? selectClass : "";
      }
      if (mode == "edit") {
        return answer?.answer === value ? okClass : "";
      }
      if (mode == "review") {
        if (isCorrect) return answer?.answer === value ? okClass : "";
        if (submit?.answer === value) return failClass;
        if (answer?.answer === value) return muteCalss;
      }
    },
    [mode, answer, submit, isCorrect],
  );

  return (
    <div className="grid grid-cols-2 gap-4 h-44 lg:h-64">
      <Button
        variant={"outline"}
        className={cn(
          "text-muted-foreground flex h-full w-full items-center rounded-lg transition-colors",
          getSelectedClass(true),
        )}
        onClick={() => handleClick(true)}
      >
        <CircleIcon className="size-14 md:size-24" />
      </Button>
      <Button
        variant={"outline"}
        className={cn(
          "text-muted-foreground flex h-full w-full items-center rounded-lg transition-colors",
          getSelectedClass(false),
        )}
        onClick={() => handleClick(false)}
      >
        <XIcon className="size-14 md:size-24" />
      </Button>
    </div>
  );
}

// 순위 맞추기 문제 - 항목 풀 + 고정 슬롯 방식
export function RankingBlockContent({
  answer,
  submit,
  mode,
  content,
  onUpdateAnswer,
  onUpdateContent,
  onUpdateSubmitAnswer,
  isCorrect,
}: BlockContentProps<"ranking">) {
  const items = content.items || [];
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  // 슬롯 개수는 전체 아이템 개수와 동일
  const slotCount = items.length;

  // 현재 순서 (edit: answer.order, solve/review: submit.order)
  // 빈 슬롯은 "" 빈 문자열로 표현
  const currentOrder = useMemo(() => {
    const rawOrder =
      mode === "edit" ? answer?.order || [] : submit?.order || [];
    // 슬롯 개수만큼의 배열로 정규화 (빈 슬롯은 "")
    const normalized: string[] = Array(slotCount).fill("");
    rawOrder.forEach((id, index) => {
      if (index < slotCount && id) {
        normalized[index] = id;
      }
    });
    return normalized;
  }, [mode, answer?.order, submit?.order, slotCount]);

  // 각 슬롯의 아이템 (인덱스 = 슬롯 위치)
  const slottedItemsMap = useMemo(() => {
    return currentOrder.map((id) =>
      id ? items.find((item) => item.id === id) || null : null,
    );
  }, [currentOrder, items]);

  // 아직 슬롯에 배치되지 않은 아이템 (항목 풀)
  const poolItems = useMemo(() => {
    const placedIds = currentOrder.filter((id) => id !== "");
    return items.filter((item) => !placedIds.includes(item.id));
  }, [items, currentOrder]);

  // 항목 추가 (edit 모드)
  const addItem = useCallback(async () => {
    const newItem = await notify
      .prompt({
        title: "항목 추가",
        description: "순위에 들어갈 항목을 작성하세요",
      })
      .then((text) => text.trim());
    if (!newItem) return;
    const newId = generateUUID();
    onUpdateContent?.((prev) => ({
      ...prev,
      items: [
        ...(prev?.items || []),
        {
          id: newId,
          text: newItem,
          type: "text" as const,
        },
      ],
    }));
  }, [onUpdateContent]);

  // 항목 삭제 (edit 모드)
  const removeItem = useCallback(
    (itemId: string) => {
      onUpdateContent?.((prev) => ({
        ...prev,
        items: prev?.items?.filter((item) => item.id !== itemId) || [],
      }));
      // 순서에서도 제거
      onUpdateAnswer?.((prev) => ({
        ...prev,
        order: prev?.order?.filter((id) => id !== itemId) || [],
      }));
    },
    [onUpdateContent, onUpdateAnswer],
  );

  // 순서 업데이트
  const updateOrder = useCallback(
    (newOrder: string[]) => {
      if (mode === "edit") {
        onUpdateAnswer?.((prev) => ({
          ...prev,
          order: newOrder,
        }));
      } else if (mode === "solve") {
        onUpdateSubmitAnswer?.({
          order: newOrder,
        });
      }
    },
    [mode, onUpdateAnswer, onUpdateSubmitAnswer],
  );

  // 드래그 시작
  const handleDragStart = useCallback(
    (e: React.DragEvent, itemId: string) => {
      if (mode === "preview" || mode === "review") return;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", itemId);
      setDraggedItemId(itemId);
    },
    [mode],
  );

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    setDraggedItemId(null);
    setDragOverSlot(null);
  }, []);

  // 슬롯에 드롭
  const handleDropOnSlot = useCallback(
    (e: React.DragEvent, slotIndex: number) => {
      e.preventDefault();
      const itemId = e.dataTransfer.getData("text/plain");
      if (!itemId) return;

      const newOrder = [...currentOrder];
      // 기존 위치에서 제거 (다른 슬롯에 있었다면)
      const existingIndex = newOrder.indexOf(itemId);
      if (existingIndex !== -1) {
        newOrder[existingIndex] = "";
      }
      // 해당 슬롯에 배치
      newOrder[slotIndex] = itemId;
      updateOrder(newOrder);
      setDragOverSlot(null);
    },
    [currentOrder, updateOrder],
  );

  // 풀로 드롭 (슬롯에서 제거)
  const handleDropOnPool = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const itemId = e.dataTransfer.getData("text/plain");
      if (!itemId) return;

      const newOrder = currentOrder.map((id) => (id === itemId ? "" : id));
      updateOrder(newOrder);
    },
    [currentOrder, updateOrder],
  );

  // 슬롯에서 아이템 제거
  const removeFromSlot = useCallback(
    (itemId: string) => {
      const newOrder = currentOrder.map((id) => (id === itemId ? "" : id));
      updateOrder(newOrder);
    },
    [currentOrder, updateOrder],
  );

  // review 모드에서 정답 여부 확인
  const getSlotStatus = useCallback(
    (slotIndex: number) => {
      if (mode !== "review") return null;
      const correctOrder = answer?.order || [];
      const submittedOrder = submit?.order || [];
      const submittedItemId = submittedOrder[slotIndex];
      const correctItemId = correctOrder[slotIndex];
      if (!submittedItemId) return "empty";
      if (submittedItemId === correctItemId) return "correct";
      return "wrong";
    },
    [mode, answer?.order, submit?.order],
  );

  // 순위 뱃지 색상 (secondary 통일)
  const rankBadgeClass = "bg-secondary text-secondary-foreground";

  // preview 모드: placeholder
  if (mode === "preview" && items.length === 0) {
    return (
      <div className="space-y-4">
        {/* 항목 풀 placeholder */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">항목</Label>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-16 rounded-md border border-dashed bg-muted/30"
              />
            ))}
          </div>
        </div>
        {/* 순위 슬롯 placeholder */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">순위</Label>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    rankBadgeClass,
                  )}
                >
                  {i + 1}
                </div>
                <div className="flex-1 h-10 rounded-md border border-dashed bg-muted/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isInteractive = mode === "edit" || mode === "solve";

  return (
    <div className="space-y-4">
      {/* 항목 풀 */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {mode === "edit" ? "항목 (드래그하여 순위에 배치)" : "항목"}
        </Label>
        <div
          className={cn(
            "flex flex-wrap gap-2 min-h-[40px] p-2 rounded-lg border-2 border-dashed transition-colors",
            isInteractive && "bg-muted/20",
            draggedItemId && isInteractive && "border-muted-foreground/30",
          )}
          onDragOver={(e) => isInteractive && e.preventDefault()}
          onDrop={(e) => isInteractive && handleDropOnPool(e)}
        >
          {poolItems.map((item) => {
            if (item.type !== "text") return null;
            return (
              <div
                key={item.id}
                draggable={isInteractive}
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "px-3 py-1.5 rounded-md border bg-card text-sm font-medium transition-all",
                  isInteractive &&
                    "cursor-grab active:cursor-grabbing hover:border-primary hover:bg-primary/5",
                  draggedItemId === item.id && "opacity-50",
                )}
              >
                {item.text}
                {mode === "edit" && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      removeItem(item.id);
                    }}
                    className="ml-2 text-muted-foreground hover:text-destructive p-0.5 rounded hover:bg-destructive/10"
                  >
                    <XIcon className="size-3" />
                  </button>
                )}
              </div>
            );
          })}
          {mode === "edit" && (
            <Button
              variant="outline"
              size="sm"
              className="border-dashed h-8"
              onClick={addItem}
            >
              <PlusIcon className="size-3 mr-1" /> 추가
            </Button>
          )}
          {poolItems.length === 0 && mode !== "edit" && (
            <span className="text-xs text-muted-foreground">
              모든 항목이 배치되었습니다
            </span>
          )}
        </div>
      </div>

      {/* 순위 슬롯 */}
      {slotCount > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            순위{" "}
            {mode === "solve" &&
              `(${currentOrder.filter((id) => id !== "").length}/${slotCount})`}
          </Label>
          <div className="space-y-2">
            {Array.from({ length: slotCount }).map((_, slotIndex) => {
              const slottedItem = slottedItemsMap[slotIndex];
              const slotStatus = getSlotStatus(slotIndex);
              const correctItemId = answer?.order?.[slotIndex];
              const correctItem = items.find(
                (item) => item.id === correctItemId,
              );

              return (
                <div
                  key={slotIndex}
                  className="flex items-center gap-3"
                  onDragOver={(e) => {
                    if (!isInteractive) return;
                    e.preventDefault();
                    setDragOverSlot(slotIndex);
                  }}
                  onDragLeave={() => setDragOverSlot(null)}
                  onDrop={(e) =>
                    isInteractive && handleDropOnSlot(e, slotIndex)
                  }
                >
                  {/* 순위 뱃지 */}
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      slotStatus === "correct" &&
                        "bg-primary text-primary-foreground",
                      slotStatus === "wrong" &&
                        "bg-destructive text-destructive-foreground",
                      slotStatus !== "correct" &&
                        slotStatus !== "wrong" &&
                        rankBadgeClass,
                    )}
                  >
                    {slotIndex + 1}
                  </div>

                  {/* 슬롯 */}
                  <div
                    className={cn(
                      "flex-1 min-h-[40px] rounded-md border-2 transition-all flex items-center px-2",
                      !slottedItem && "border-dashed bg-muted/20",
                      slottedItem && "border-transparent bg-transparent",
                      dragOverSlot === slotIndex &&
                        isInteractive &&
                        "border-primary bg-primary/10",
                      slotStatus === "correct" && "border-primary/50",
                      slotStatus === "wrong" && "border-destructive/50",
                    )}
                  >
                    {slottedItem ? (
                      <div
                        draggable={isInteractive}
                        onDragStart={(e) => handleDragStart(e, slottedItem.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "flex items-center w-full px-3 py-2 rounded-md border transition-all",
                          isInteractive &&
                            "cursor-grab active:cursor-grabbing hover:border-primary hover:bg-primary/5 active:scale-[0.98]",
                          draggedItemId === slottedItem.id && "opacity-50",
                          slotStatus === "correct" && okClass,
                          slotStatus === "wrong" && failClass,
                          !slotStatus && "bg-card",
                        )}
                      >
                        <span className="text-sm font-medium flex-1">
                          {slottedItem.type === "text" && slottedItem.text}
                        </span>
                        {isInteractive && (
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              removeFromSlot(slottedItem.id);
                            }}
                            className="text-muted-foreground hover:text-foreground ml-2 p-1 -mr-1 rounded hover:bg-muted"
                          >
                            <XIcon className="size-4" />
                          </button>
                        )}
                        {mode === "review" &&
                          slotStatus === "wrong" &&
                          correctItem && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (정답:{" "}
                              {correctItem.type === "text" && correctItem.text})
                            </span>
                          )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground px-1">
                        {isInteractive ? "여기로 드래그하세요" : "비어있음"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
