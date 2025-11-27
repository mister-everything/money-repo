"use client";
import {
  BlockAnswer,
  BlockAnswerSubmit,
  BlockContent,
  BlockType,
} from "@service/solves/shared";
import { deduplicate, generateUUID, StateUpdate } from "@workspace/util";
import { CircleIcon, PlusIcon, XIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
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

  // 현재 순서 (배치된 아이템 ID 배열)
  const currentOrder = useMemo(() => {
    return mode === "edit" ? answer?.order || [] : submit?.order || [];
  }, [mode, answer?.order, submit?.order]);

  // 배치된 아이템
  const placedItems = useMemo(() => {
    return currentOrder
      .map((id) => items.find((item) => item.id === id))
      .filter(Boolean) as typeof items;
  }, [currentOrder, items]);

  // 배치되지 않은 아이템 (항목 풀)
  const poolItems = useMemo(() => {
    return items.filter((item) => !currentOrder.includes(item.id));
  }, [items, currentOrder]);

  // 순서 업데이트 헬퍼
  const updateOrder = useCallback(
    (newOrder: string[]) => {
      if (mode === "edit") {
        onUpdateAnswer?.((prev) => ({ ...prev, order: newOrder }));
      } else if (mode === "solve") {
        onUpdateSubmitAnswer?.({ order: newOrder });
      }
    },
    [mode, onUpdateAnswer, onUpdateSubmitAnswer],
  );

  // 항목 추가 (edit 모드)
  const addItem = useCallback(async () => {
    const newItem = await notify
      .prompt({
        title: "항목 추가",
        description: "순위에 들어갈 항목을 작성하세요",
      })
      .then((text) => text.trim());
    if (!newItem) return;
    onUpdateContent?.((prev) => ({
      ...prev,
      items: [
        ...(prev?.items || []),
        { id: generateUUID(), text: newItem, type: "text" as const },
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
      onUpdateAnswer?.((prev) => ({
        ...prev,
        order: prev?.order?.filter((id) => id !== itemId) || [],
      }));
    },
    [onUpdateContent, onUpdateAnswer],
  );

  // 풀에서 순위로 추가 (맨 뒤에)
  const addToRanking = useCallback(
    (itemId: string) => {
      updateOrder([...currentOrder, itemId]);
    },
    [currentOrder, updateOrder],
  );

  // 순위에서 제거
  const removeFromRanking = useCallback(
    (itemId: string) => {
      updateOrder(currentOrder.filter((id) => id !== itemId));
    },
    [currentOrder, updateOrder],
  );

  // review 모드에서 정답 여부 확인
  const getSlotStatus = useCallback(
    (slotIndex: number) => {
      if (mode !== "review") return null;
      const correctOrder = answer?.order || [];
      const submittedOrder = submit?.order || [];
      if (!submittedOrder[slotIndex]) return "empty";
      return submittedOrder[slotIndex] === correctOrder[slotIndex]
        ? "correct"
        : "wrong";
    },
    [mode, answer?.order, submit?.order],
  );

  const isInteractive = mode === "edit" || mode === "solve";
  const rankBadgeClass = "bg-secondary text-secondary-foreground";

  // preview 모드: placeholder
  if (mode === "preview" && items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">항목</Label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 w-16 rounded-md border border-dashed bg-muted/30"
              />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">순위</Label>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    rankBadgeClass,
                  )}
                >
                  {i}
                </div>
                <div className="flex-1 h-10 rounded-md border border-dashed bg-muted/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 항목 풀 */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {isInteractive ? "항목 (클릭하여 순위에 추가)" : "항목"}
        </Label>
        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-lg border-2 border-dashed bg-muted/20">
          {poolItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => isInteractive && addToRanking(item.id)}
              className={cn(
                "px-3 py-1.5 rounded-md border bg-card text-sm font-medium transition-all flex items-center gap-1",
                isInteractive &&
                  "cursor-pointer hover:border-primary hover:bg-primary/5",
              )}
            >
              {item.type === "text" && item.text}
              {mode === "edit" && (
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.id);
                  }}
                  className="ml-1 text-muted-foreground hover:text-destructive p-0.5 rounded hover:bg-destructive/10"
                >
                  <XIcon className="size-3" />
                </span>
              )}
            </button>
          ))}
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

      {/* 순위 */}
      {items.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            순위 {mode === "solve" && `(${placedItems.length}/${items.length})`}
          </Label>
          <div className="space-y-2">
            {placedItems.length === 0 ? (
              <div className="flex items-center gap-3 text-muted-foreground text-sm py-4 justify-center border-2 border-dashed rounded-md">
                {isInteractive
                  ? "위 항목을 클릭하여 순위를 정하세요"
                  : "배치된 항목이 없습니다"}
              </div>
            ) : (
              placedItems.map((item, index) => {
                const slotStatus = getSlotStatus(index);
                const correctItemId = answer?.order?.[index];
                const correctItem = items.find((i) => i.id === correctItemId);

                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        slotStatus === "correct" &&
                          "bg-primary text-primary-foreground",
                        slotStatus === "wrong" &&
                          "bg-destructive text-destructive-foreground",
                        !slotStatus && rankBadgeClass,
                      )}
                    >
                      {index + 1}
                    </div>
                    <div
                      className={cn(
                        "flex-1 flex items-center px-3 py-2 rounded-md border transition-all bg-card",
                        slotStatus === "correct" && okClass,
                        slotStatus === "wrong" && failClass,
                      )}
                    >
                      <span className="text-sm font-medium flex-1">
                        {item.type === "text" && item.text}
                      </span>
                      {isInteractive && (
                        <button
                          type="button"
                          onClick={() => removeFromRanking(item.id)}
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
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
