"use client";
import {
  BlockAnswer,
  BlockAnswerSubmit,
  BlockContent,
  BlockType,
} from "@service/solves/shared";
import { deduplicate, generateUUID, noop, StateUpdate } from "@workspace/util";
import { CircleIcon, PlusIcon, XIcon } from "lucide-react";
import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InDevelopment } from "@/components/ui/in-development";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/components/ui/notify";
import { cn } from "@/lib/utils";
import { BlockComponentMode } from "./types";

// 사용자가 선택했고 정답 일때
const okClass = "border-primary bg-primary/5 text-primary hover:text-primary";

// 문제를 풀때 선택한 것 일단 ok 랑 동일하게
const selectClass =
  "border-primary bg-primary/5 text-primary hover:text-primary";

// 사용자가 선택했고 오답 일때
const failClass = "border-destructive bg-destructive/5 text-destructive";

// 사용자가 선택은 안했지만 (오답제출) 정답일때
const muteCalss = "bg-secondary border-muted-foreground";

type BlockContentProps<T extends BlockType = BlockType> = {
  content: BlockContent<T>;
  mode: BlockComponentMode;
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
