"use client";
import {
  BlockAnswer,
  BlockAnswerSubmit,
  BlockContent,
  BlockType,
  DEFAULT_BLOCK_ANSWER_MAX_LENGTH,
  DEFAULT_BLOCK_MAX_ANSWERS,
  MCQ_BLOCK_MAX_OPTIONS,
  MCQ_BLOCK_MIN_OPTIONS,
  MCQ_BLOCK_OPTION_MAX_LENGTH,
  RANKING_BLOCK_ITEM_MAX_LENGTH,
  RANKING_BLOCK_MAX_ITEMS,
} from "@service/solves/shared";
import { createIdGenerator, deduplicate, StateUpdate } from "@workspace/util";
import { CheckIcon, CircleIcon, PlusIcon, XIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InDevelopment } from "@/components/ui/in-development";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/components/ui/notify";
import { cn } from "@/lib/utils";
import { WorkBookComponentMode } from "./types";

// 정답 일때
const okClass =
  "border-primary! bg-primary/5! text-primary! hover:text-primary! hover:bg-primary/10!";

// 사용자가 선택했고 오답 일때
const failClass =
  "border-destructive! bg-destructive/5! text-destructive! hover:text-destructive! hover:bg-destructive/10!";

type BlockContentProps<T extends BlockType = BlockType> = {
  content: BlockContent<T>;
  mode: WorkBookComponentMode;
  isCorrect?: boolean;
  onUpdateContent?: (content: StateUpdate<BlockContent<T>>) => void;
  onUpdateSubmitAnswer?: (answer: StateUpdate<BlockAnswerSubmit<T>>) => void;
  onUpdateAnswer?: (answer: StateUpdate<BlockAnswer<T>>) => void;
  answer?: BlockAnswer<T>;
  submit?: BlockAnswerSubmit<T>;
  isSuggest?: boolean;
  onAcceptContent?: () => void;
  onRejectContent?: () => void;
  onAcceptAnswer?: () => void;
  onRejectAnswer?: () => void;
};
// 주관식 문제
export function DefaultBlockContent({
  answer,
  submit,
  mode,
  onUpdateAnswer,
  onUpdateSubmitAnswer,
  isCorrect,
  isSuggest = false,
  onAcceptAnswer,
  onRejectAnswer,
}: BlockContentProps<"default">) {
  const handleChangeSubmitAnswer = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (mode == "solve")
        onUpdateSubmitAnswer?.({ answer: e.currentTarget.value });
    },
    [onUpdateSubmitAnswer, mode],
  );

  const addAnswer = useCallback(async () => {
    if ((answer?.answer.length ?? 0) >= DEFAULT_BLOCK_MAX_ANSWERS)
      return toast.warning(
        `정답은 최대 ${DEFAULT_BLOCK_MAX_ANSWERS}개까지 입니다.`,
      );
    const newAnswer = await notify
      .prompt({
        title: "정답 추가",
        description: "답안을 작성하세요",
        maxLength: DEFAULT_BLOCK_ANSWER_MAX_LENGTH,
      })
      .then((answer) => answer.trim());
    if (!newAnswer) return;
    onUpdateAnswer?.((prev) => ({
      ...prev,
      answer: deduplicate([...(prev?.answer || []), newAnswer]),
    }));
  }, [onUpdateAnswer, answer?.answer.length]);

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
      {isSuggest && (onAcceptAnswer || onRejectAnswer) && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-auto">정답</span>
          {onRejectAnswer && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs text-destructive hover:text-destructive"
              onClick={onRejectAnswer}
            >
              <XIcon className="size-4" />
            </Button>
          )}
          {onAcceptAnswer && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs text-primary hover:text-primary hover:bg-primary/10"
              onClick={onAcceptAnswer}
            >
              <CheckIcon className="size-4" />
            </Button>
          )}
        </div>
      )}
      <div className="flex gap-2">
        {(mode == "solve" || mode == "preview") && (
          <Input
            placeholder="답안을 작성하세요"
            className="w-full shadow-none"
            value={submit?.answer || ""}
            onChange={handleChangeSubmitAnswer}
            disabled={mode == "preview"}
          />
        )}
        {mode == "review" && (
          <div className="flex flex-col gap-2 text-muted-foreground w-full">
            <div
              className={cn(
                isCorrect ? okClass : failClass,
                "w-full rounded-lg p-4 border flex items-center",
              )}
            >
              {isCorrect ? (
                <CheckIcon className="size-5 mr-2 stroke-3" />
              ) : (
                <XIcon className="size-5 mr-2 stroke-3" />
              )}
              {submit?.answer || "정답을 제출하지 않았습니다."}
              <Badge
                className={cn(
                  "ml-auto",
                  isCorrect ? "bg-primary" : "bg-destructive",
                )}
              >
                {isCorrect ? "정답" : "오답"}
              </Badge>
            </div>
          </div>
        )}
        {mode == "edit" && (
          <div className="flex flex-wrap items-center gap-2">
            {answer?.answer.map((correctAnswer, index) =>
              isSuggest ? (
                <div
                  key={index}
                  className={cn(
                    okClass,
                    "inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium",
                  )}
                >
                  {correctAnswer}
                </div>
              ) : (
                <Button
                  onClick={() => removeAnswer(index)}
                  variant="outline"
                  className={okClass}
                  key={index}
                >
                  {correctAnswer}
                  <XIcon />
                </Button>
              ),
            )}
            {(answer?.answer.length ?? 0) < DEFAULT_BLOCK_MAX_ANSWERS &&
              !isSuggest && (
                <Button
                  onClick={addAnswer}
                  variant="outline"
                  className="border-dashed"
                >
                  <PlusIcon /> 정답 추가
                </Button>
              )}
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
  isSuggest = false,
  onAcceptContent,
  onRejectContent,
  onAcceptAnswer,
  onRejectAnswer,
}: BlockContentProps<"mcq-multiple">) {
  const options = content.options ?? [];
  const addOption = useCallback(async () => {
    if ((content.options.length ?? 0) >= MCQ_BLOCK_MAX_OPTIONS)
      return toast.warning(
        `보기는 최대 ${MCQ_BLOCK_MAX_OPTIONS}개까지 입니다.`,
      );
    const newAnswer = await notify
      .prompt({
        title: "보기 추가",
        description: "선택지를 작성하세요",
        maxLength: MCQ_BLOCK_OPTION_MAX_LENGTH,
      })
      .then((answer) => answer.trim());
    if (!newAnswer) return;
    onUpdateContent?.((prev) => {
      const gen = createIdGenerator({
        existingIds: prev?.options?.map((option) => option.id) || [],
      });
      return {
        ...prev,
        options: [
          ...(prev?.options || []),
          {
            id: gen(),
            text: newAnswer,
            type: "text",
          },
        ],
      };
    });
  }, [onUpdateContent, content?.options?.length]);

  const removeOption = useCallback(
    (optionId: string) => {
      onUpdateContent?.((prev) => ({
        ...prev,
        options:
          prev?.options?.filter((option) => option.id !== optionId) || [],
      }));
      onUpdateAnswer?.((prev) => {
        return prev.answer?.includes(optionId)
          ? { answer: prev.answer.filter((id) => id !== optionId) || [] }
          : prev;
      });
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

  const getSelectedClass = useCallback(
    (optionId: string) => {
      if (mode == "solve" && submit?.answer?.includes(optionId)) return okClass;
      if (mode == "edit" && answer?.answer.includes(optionId)) return okClass;
      if (mode == "review") {
        if (submit?.answer?.includes(optionId))
          return answer?.answer.includes(optionId) ? okClass : failClass;
        return "bg-card text-muted-foreground/50";
      }

      return "hover:bg-muted-foreground/5 hover:border-muted-foreground";
    },
    [mode, answer, submit],
  );

  return (
    <div className="flex flex-col gap-3">
      {isSuggest &&
        (onAcceptContent ||
          onRejectContent ||
          onAcceptAnswer ||
          onRejectAnswer) && (
          <div className="flex flex-col gap-2">
            {(onAcceptContent || onRejectContent) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-auto">
                  보기
                </span>
                {onRejectContent && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-destructive hover:text-destructive"
                    onClick={onRejectContent}
                  >
                    <XIcon className="size-4" />
                  </Button>
                )}
                {onAcceptContent && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-primary hover:text-primary hover:bg-primary/10"
                    onClick={onAcceptContent}
                  >
                    <CheckIcon className="size-4" />
                  </Button>
                )}
              </div>
            )}
            {(onAcceptAnswer || onRejectAnswer) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-auto">
                  정답
                </span>
                {onRejectAnswer && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-destructive hover:text-destructive"
                    onClick={onRejectAnswer}
                  >
                    Reject
                  </Button>
                )}
                {onAcceptAnswer && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-primary hover:text-primary hover:bg-primary/10"
                    onClick={onAcceptAnswer}
                  >
                    Accept
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      {options.map((option, index) => {
        if (option.type == "text") {
          const status =
            mode == "review" && submit?.answer.includes(option.id)
              ? answer?.answer?.includes(option.id)
                ? "correct"
                : "incorrect"
              : mode == "review"
                ? "unchecked"
                : undefined;

          return (
            <div
              key={option.id}
              onClick={
                isSuggest ? undefined : () => handleOptionSelect(option.id)
              }
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 transition-colors select-none",
                !isSuggest &&
                  (mode == "edit" || mode == "solve") &&
                  "cursor-pointer",
                getSelectedClass(option.id),
              )}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                {status == "correct" ? (
                  <CheckIcon className="size-5 mr-2 stroke-3" />
                ) : status == "incorrect" ? (
                  <XIcon className="size-5 mr-2 stroke-3" />
                ) : mode == "edit" ? (
                  <Checkbox
                    id={option.id}
                    checked={answer?.answer.includes(option.id)}
                    disabled={isSuggest}
                    className="mr-3 rounded-sm border-border bg-card"
                  />
                ) : (
                  <div
                    className={cn(
                      "size-5 mr-2 rounded-full border border-foreground text-foreground flex items-center justify-center text-sm",
                      submit?.answer?.includes(option.id) &&
                        "border-primary text-primary",
                      status == "unchecked" &&
                        "border-muted-foreground/50 text-muted-foreground/50",
                    )}
                  >
                    {index + 1}
                  </div>
                )}

                <span className="text-sm font-medium leading-snug">
                  {option.text}
                </span>
              </div>
              <div className="flex-1" />
              {mode == "edit" && !isSuggest ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(option.id);
                  }}
                  size="icon"
                  className="size-6! text-muted-foreground"
                  variant="ghost"
                >
                  <XIcon className="size-3!" />
                </Button>
              ) : status == "correct" ? (
                <Badge className="bg-primary text-primary-foreground">
                  정답
                </Badge>
              ) : status == "incorrect" ? (
                <Badge className="bg-destructive">오답</Badge>
              ) : undefined}
            </div>
          );
        }

        return (
          <InDevelopment key={option.id} className="w-full text-sm h-48">
            아직 지원하지 않는 옵션 입니다.
          </InDevelopment>
        );
      })}
      {mode == "preview" &&
        options.length === 0 &&
        Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="w-full h-12 rounded-lg border border-dashed bg-muted-foreground/5"
          />
        ))}
      {mode == "edit" &&
        options.length <= MCQ_BLOCK_MIN_OPTIONS &&
        !isSuggest && (
          <Button
            variant="outline"
            size="lg"
            className="border-dashed w-full py-6!"
            onClick={addOption}
          >
            <PlusIcon /> 보기 추가
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
  isCorrect,
  content,
  onUpdateAnswer,
  onUpdateContent,
  onUpdateSubmitAnswer,
  isSuggest = false,
  onAcceptContent,
  onRejectContent,
  onAcceptAnswer,
  onRejectAnswer,
}: BlockContentProps<"mcq">) {
  const options = content.options ?? [];
  const addOption = useCallback(async () => {
    if ((content.options.length ?? 0) >= MCQ_BLOCK_MAX_OPTIONS)
      return toast.warning(
        `보기는 최대 ${MCQ_BLOCK_MAX_OPTIONS}개까지 입니다.`,
      );
    const newAnswer = await notify
      .prompt({
        title: "보기 추가",
        description: "선택지를 작성하세요",
        maxLength: MCQ_BLOCK_OPTION_MAX_LENGTH,
      })
      .then((answer) => answer.trim());
    if (!newAnswer) return;
    onUpdateContent?.((prev) => {
      const gen = createIdGenerator({
        existingIds: prev?.options?.map((option) => option.id) || [],
      });
      return {
        ...prev,
        options: [
          ...(prev?.options || []),
          {
            id: gen(),
            text: newAnswer,
            type: "text",
          },
        ],
      };
    });
  }, [onUpdateContent, content?.options?.length]);

  const removeOption = useCallback(
    (optionId: string) => {
      onUpdateContent?.((prev) => ({
        ...prev,
        options:
          prev?.options?.filter((option) => option.id !== optionId) || [],
      }));
      onUpdateAnswer?.((prev) => {
        return prev.answer == optionId ? { answer: "" } : prev;
      });
    },
    [onUpdateContent],
  );

  const handleOptionSelect = useCallback(
    (optionId: string) => {
      if (mode == "solve") return onUpdateSubmitAnswer?.({ answer: optionId });
      if (mode == "edit") return onUpdateAnswer?.({ answer: optionId });
    },
    [onUpdateAnswer, mode, onUpdateSubmitAnswer],
  );

  const getSelectedClass = useCallback(
    (optionId: string) => {
      if (mode == "solve" && submit?.answer?.includes(optionId)) return okClass;
      if (mode == "edit" && answer?.answer.includes(optionId)) return okClass;
      if (mode == "review") {
        if (submit?.answer?.includes(optionId))
          return isCorrect ? okClass : failClass;
        return "bg-card text-muted-foreground/50";
      }

      return "hover:bg-muted-foreground/5 hover:border-muted-foreground";
    },
    [mode, answer, submit, isCorrect],
  );

  return (
    <div className="flex flex-col gap-3">
      {isSuggest &&
        (onAcceptContent ||
          onRejectContent ||
          onAcceptAnswer ||
          onRejectAnswer) && (
          <div className="flex flex-col gap-2">
            {(onAcceptContent || onRejectContent) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-auto">
                  보기
                </span>
                {onRejectContent && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-destructive hover:text-destructive"
                    onClick={onRejectContent}
                  >
                    Reject
                  </Button>
                )}
                {onAcceptContent && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-primary hover:text-primary hover:bg-primary/10"
                    onClick={onAcceptContent}
                  >
                    Accept
                  </Button>
                )}
              </div>
            )}
            {(onAcceptAnswer || onRejectAnswer) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-auto">
                  정답
                </span>
                {onRejectAnswer && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-destructive hover:text-destructive"
                    onClick={onRejectAnswer}
                  >
                    <XIcon className="size-4" />
                  </Button>
                )}
                {onAcceptAnswer && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-primary hover:text-primary hover:bg-primary/10"
                    onClick={onAcceptAnswer}
                  >
                    <CheckIcon className="size-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      {options.map((option, index) => {
        if (option.type == "text") {
          const status =
            mode == "review" && submit?.answer == option.id
              ? isCorrect
                ? "correct"
                : "incorrect"
              : mode == "review"
                ? "unchecked"
                : undefined;

          return (
            <div
              key={option.id}
              onClick={
                isSuggest ? undefined : () => handleOptionSelect(option.id)
              }
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 transition-colors select-none",
                !isSuggest &&
                  (mode == "edit" || mode == "solve") &&
                  "cursor-pointer",
                getSelectedClass(option.id),
              )}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                {status == "correct" ? (
                  <CheckIcon className="size-5 mr-2 stroke-3" />
                ) : status == "incorrect" ? (
                  <XIcon className="size-5 mr-2 stroke-3" />
                ) : mode == "edit" ? (
                  <Checkbox
                    id={option.id}
                    checked={answer?.answer == option.id}
                    disabled={isSuggest}
                    className="mr-3 rounded-sm border-border bg-card"
                  />
                ) : (
                  <div
                    className={cn(
                      "size-5 mr-2 rounded-full border border-foreground text-foreground flex items-center justify-center text-sm",
                      mode == "solve" &&
                        submit?.answer == option.id &&
                        "border-primary text-primary",
                      status == "unchecked" &&
                        "border-muted-foreground/50 text-muted-foreground/50",
                    )}
                  >
                    {index + 1}
                  </div>
                )}

                <span className="text-sm font-medium leading-snug">
                  {option.text}
                </span>
              </div>
              <div className="flex-1" />
              {mode == "edit" && !isSuggest ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(option.id);
                  }}
                  size="icon"
                  className="size-6! text-muted-foreground"
                  variant="ghost"
                >
                  <XIcon className="size-3!" />
                </Button>
              ) : status == "correct" ? (
                <Badge className="bg-primary text-primary-foreground">
                  정답
                </Badge>
              ) : status == "incorrect" ? (
                <Badge className="bg-destructive">오답</Badge>
              ) : undefined}
            </div>
          );
        }

        return (
          <InDevelopment key={option.id} className="w-full text-sm h-48">
            아직 지원하지 않는 옵션 입니다.
          </InDevelopment>
        );
      })}
      {mode == "preview" &&
        options.length === 0 &&
        Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="w-full h-12 rounded-lg border border-dashed bg-muted-foreground/5"
          />
        ))}
      {mode == "edit" &&
        options.length <= MCQ_BLOCK_MIN_OPTIONS &&
        !isSuggest && (
          <Button
            variant="outline"
            size="lg"
            className="border-dashed w-full py-6!"
            onClick={addOption}
          >
            <PlusIcon /> 보기 추가
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
  isSuggest = false,
  onAcceptAnswer,
  onRejectAnswer,
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
        return submit?.answer === value ? okClass : "";
      }
      if (mode == "edit") {
        return answer?.answer === value ? okClass : "";
      }
      if (mode == "review" && submit?.answer === value) {
        return isCorrect ? okClass : failClass;
      }
    },
    [mode, answer, submit, isCorrect],
  );

  return (
    <div className="flex flex-col gap-3">
      {isSuggest && (onAcceptAnswer || onRejectAnswer) && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-auto">정답</span>
          {onRejectAnswer && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs text-destructive hover:text-destructive"
              onClick={onRejectAnswer}
            >
              <XIcon className="size-4" />
            </Button>
          )}
          {onAcceptAnswer && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs text-primary hover:text-primary hover:bg-primary/10"
              onClick={onAcceptAnswer}
            >
              <CheckIcon className="size-4" />
            </Button>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 h-44 lg:h-64">
        <Button
          variant={"outline"}
          className={cn(
            "text-muted-foreground flex h-full w-full items-center rounded-lg transition-colors",
            getSelectedClass(true),
          )}
          onClick={isSuggest ? undefined : () => handleClick(true)}
          disabled={isSuggest}
        >
          <CircleIcon className="size-14 md:size-24" />
        </Button>
        <Button
          variant={"outline"}
          className={cn(
            "text-muted-foreground flex h-full w-full items-center rounded-lg transition-colors",
            getSelectedClass(false),
          )}
          onClick={isSuggest ? undefined : () => handleClick(false)}
          disabled={isSuggest}
        >
          <XIcon className="size-14 md:size-24" />
        </Button>
      </div>
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
  isSuggest = false,
  onAcceptContent,
  onRejectContent,
  onAcceptAnswer,
  onRejectAnswer,
}: BlockContentProps<"ranking">) {
  const items = content.items || [];
  const slotCount = items.length;

  const currentOrder = useMemo(() => {
    const rawOrder =
      mode === "edit" ? answer?.order || [] : submit?.order || [];
    const normalized: string[] = Array(slotCount).fill("");
    rawOrder.forEach((id, index) => {
      if (index < slotCount && id) normalized[index] = id;
    });
    return normalized;
  }, [mode, answer?.order, submit?.order, slotCount]);

  const poolItems = useMemo(() => {
    const placedIds = currentOrder.filter((id) => id !== "");
    return items.filter((item) => !placedIds.includes(item.id));
  }, [items, currentOrder]);

  // 다음 빈 슬롯 인덱스 계산
  const nextEmptySlotIndex = useMemo(() => {
    return currentOrder.findIndex((id) => id === "");
  }, [currentOrder]);

  const updateOrder = useCallback(
    (newOrder: string[]) => {
      // 빈 문자열("")도 유지해서 슬롯 인덱스를 보존
      // 예: ["A", "", "C"]는 슬롯0=A, 슬롯1=비어있음, 슬롯2=C를 의미
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
    if ((items.length ?? 0) >= RANKING_BLOCK_MAX_ITEMS)
      return toast.warning(
        `항목은 최대 ${RANKING_BLOCK_MAX_ITEMS}개까지 입니다.`,
      );
    const newItem = await notify
      .prompt({
        title: "항목 추가",
        description: "순위에 들어갈 항목을 작성하세요",
        maxLength: RANKING_BLOCK_ITEM_MAX_LENGTH,
      })
      .then((text) => text.trim());
    if (!newItem) return;
    onUpdateContent?.((prev) => {
      const gen = createIdGenerator({
        existingIds: prev?.items?.map((item) => item.id) || [],
      });
      return {
        ...prev,
        items: [
          ...(prev?.items || []),
          { id: gen(), text: newItem, type: "text" as const },
        ],
      };
    });
  }, [onUpdateContent, items.length]);

  const removeItem = useCallback(
    (itemId: string) => {
      if (mode === "edit") {
        onUpdateAnswer?.((prev) => ({
          ...prev,
          order: prev?.order?.filter((id) => id !== itemId) || [],
        }));
        onUpdateContent?.((prev) => ({
          ...prev,
          items: prev?.items?.filter((item) => item.id !== itemId) || [],
        }));
      }
    },
    [mode, onUpdateAnswer, onUpdateContent],
  );

  const isInteractive = mode === "edit" || mode === "solve";
  const rankBadgeClass = "bg-secondary text-secondary-foreground";
  const filledCount = currentOrder.filter((id) => id !== "").length;

  // 클릭하면 다음 빈 슬롯에 자동 추가
  const handleItemClick = useCallback(
    (itemId: string) => {
      if (!isInteractive) return;
      if (nextEmptySlotIndex === -1) return; // 모든 슬롯이 채워져 있음
      if (currentOrder.includes(itemId)) return; // 이미 배치됨
      const newOrder = [...currentOrder];
      newOrder[nextEmptySlotIndex] = itemId;
      updateOrder(newOrder);
    },
    [isInteractive, nextEmptySlotIndex, currentOrder, updateOrder],
  );

  const removeFromSlot = useCallback(
    (slotIndex: number) => {
      const newOrder = [...currentOrder];
      newOrder[slotIndex] = "";
      updateOrder(newOrder);
    },
    [currentOrder, updateOrder],
  );

  const resetAll = useCallback(() => {
    updateOrder([]);
  }, [updateOrder]);

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

  if (mode === "preview" && items.length === 0) {
    return (
      <div className="space-y-4">
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
      {isSuggest &&
        (onAcceptContent ||
          onRejectContent ||
          onAcceptAnswer ||
          onRejectAnswer) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-auto">순위</span>
            {(onRejectContent || onRejectAnswer) && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs text-destructive hover:text-destructive"
                onClick={() => {
                  onRejectContent?.();
                  onRejectAnswer?.();
                }}
              >
                <XIcon className="size-4" />
              </Button>
            )}
            {(onAcceptContent || onAcceptAnswer) && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => {
                  onAcceptContent?.();
                  onAcceptAnswer?.();
                }}
              >
                <CheckIcon className="size-4" />
              </Button>
            )}
          </div>
        )}
      {!isSuggest && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {isInteractive ? "항목 (클릭하여 순위에 추가)" : "항목"}
          </Label>
          <div
            className={cn(
              mode != "review" && "bg-primary/5 border border-primary",
              "flex flex-wrap gap-2 min-h-[40px] p-2 rounded-lg",
            )}
          >
            {poolItems.map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  mode === "edit"
                    ? removeItem(item.id)
                    : handleItemClick(item.id)
                }
                className={cn(
                  "px-3 py-1.5 rounded-md border bg-card text-sm font-medium transition-all flex items-center gap-1 select-none",
                  isInteractive &&
                    "cursor-pointer hover:border-primary hover:bg-primary/5 active:scale-95",
                )}
              >
                {item.type === "text" && item.text}
                {mode === "edit" && (
                  <span
                    role="button"
                    className="ml-1 text-muted-foreground p-0.5 rounded"
                  >
                    <XIcon className="size-3" />
                  </span>
                )}
              </div>
            ))}
            {mode === "edit" && items.length < RANKING_BLOCK_MAX_ITEMS && (
              <Button
                variant="outline"
                size="sm"
                className="border-dashed h-8"
                onClick={addItem}
              >
                <PlusIcon className="size-3 mr-1" /> 추가
              </Button>
            )}
          </div>
        </div>
      )}

      {slotCount > 0 && mode === "review" && (
        <div className="space-y-4">
          {/* 내 제출 순서 */}
          <div className="space-y-2">
            <div className="space-y-2">
              {Array.from({ length: slotCount }).map((_, slotIndex) => {
                const itemId = currentOrder[slotIndex];
                const item = itemId ? items.find((i) => i.id === itemId) : null;
                const slotStatus = getSlotStatus(slotIndex);

                return (
                  <div key={slotIndex} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "size-12 rounded-md flex items-center justify-center text-xs font-bold shrink-0",
                        rankBadgeClass,
                      )}
                    >
                      {slotIndex + 1}
                    </div>
                    <div
                      className={cn(
                        "flex-1 flex items-center px-4 py-3 rounded-md border transition-all bg-card",
                        slotStatus === "correct" ? okClass : failClass,
                      )}
                    >
                      {slotStatus === "correct" ? (
                        <CheckIcon className="size-4 mr-2 stroke-3" />
                      ) : (
                        <XIcon className="size-4 mr-2 stroke-3" />
                      )}
                      <span className="text-sm font-medium">
                        {item
                          ? item.type === "text" && item.text
                          : "제출하지 않음"}
                      </span>
                      <Badge
                        className={cn(
                          "ml-auto",
                          slotStatus === "correct"
                            ? "bg-primary"
                            : "bg-destructive",
                        )}
                      >
                        {slotStatus === "correct" ? "정답" : "오답"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {slotCount > 0 && mode !== "review" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              순위 {mode === "solve" && `(${filledCount}/${slotCount})`}
            </Label>
            {isInteractive && filledCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground hover:text-foreground shadow-none"
                onClick={resetAll}
              >
                초기화
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {Array.from({ length: slotCount }).map((_, slotIndex) => {
              const itemId = currentOrder[slotIndex];
              const item = itemId ? items.find((i) => i.id === itemId) : null;
              const slotStatus = getSlotStatus(slotIndex);
              const isNextSlot = slotIndex === nextEmptySlotIndex;

              return (
                <div key={slotIndex} className="flex items-center gap-3">
                  {/* 순위 뱃지 */}
                  <div
                    className={cn(
                      "size-12 rounded-md flex items-center justify-center text-lg font-bold shrink-0",
                      slotStatus === "correct" &&
                        "bg-primary text-primary-foreground",
                      slotStatus !== "correct" && rankBadgeClass,
                      isNextSlot &&
                        isInteractive &&
                        "bg-primary text-primary-foreground",
                    )}
                  >
                    {slotIndex + 1}
                  </div>

                  {/* 슬롯 */}
                  {item ? (
                    <div
                      onClick={() => isInteractive && removeFromSlot(slotIndex)}
                      className={cn(
                        "flex-1 flex items-center px-3 py-3 rounded-md border transition-all bg-card select-none",
                        slotStatus === "correct" && okClass,
                        isInteractive &&
                          "cursor-pointer hover:bg-destructive/5 hover:border-destructive/50 active:scale-[0.99]",
                      )}
                    >
                      <span className="text font-medium flex-1">
                        {item.type === "text" && item.text}
                      </span>
                      {isInteractive && (
                        <XIcon className="size-5 text-muted-foreground" />
                      )}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "flex-1 min-h-[40px] py-3 rounded-md border-2 border-dashed bg-muted/20 transition-all flex items-center justify-center",
                        isNextSlot &&
                          isInteractive &&
                          "border-primary bg-primary/10 animate-pulse",
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm",
                          isNextSlot && isInteractive
                            ? "text-primary font-medium"
                            : "text-muted-foreground",
                        )}
                      >
                        {isNextSlot && isInteractive ? "다음 순위" : "비어있음"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
