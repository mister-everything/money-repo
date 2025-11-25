"use client";
import {
  BlockAnswer,
  BlockAnswerSubmit,
  BlockContent,
  BlockType,
} from "@service/solves/shared";
import { generateUUID, noop, StateUpdate } from "@workspace/util";
import { PlusIcon, XIcon } from "lucide-react";
import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InDevelopment } from "@/components/ui/in-development";
import { Input } from "@/components/ui/input";
import { notify } from "@/components/ui/notify";
import { cn } from "@/lib/utils";
import { BlockComponentMode } from "./types";

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
      answer: [...(prev?.answer || []), newAnswer],
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
        {mode == "solve" && (
          <Input
            placeholder="답안을 작성하세요"
            className="w-full"
            value={submit?.answer}
            onChange={handleChangeSubmitAnswer}
          />
        )}
        {mode == "review" && (
          <div className="text-sm flex flex-col gap-2 text-muted-foreground">
            <p className={!isCorrect ? "text-destructive" : undefined}>
              {submit?.answer || "정답을 제출하지 않았습니다."}
            </p>
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
            <p className="text-muted-foreground">
              이곳은 추후 해설이 추가될 예정입니다.
            </p>
          </div>
        )}
        {mode == "preview" && (
          <div className="flex flex-wrap items-center gap-2">
            {answer?.answer.map((correctAnswer, index) => (
              <Button
                className="cursor-default"
                key={index}
                variant="secondary"
              >
                {correctAnswer}
              </Button>
            ))}
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

  return (
    <div className="flex flex-col gap-3">
      {content.options.map((option, index) => {
        if (option.type == "text") {
          const name = `block-option-${option.id}`;
          const checked = answer?.answer.includes(option.id);
          const isSelected =
            mode == "solve" && submit?.answer?.includes(option.id);

          return (
            <div
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 transition-colors",
                (mode == "edit" || mode == "solve") && "cursor-pointer",
                isSelected &&
                  isCorrect == false &&
                  "border-destructive bg-destructive/10",
                mode != "solve" && checked
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-accent",
              )}
            >
              <input
                type="checkbox"
                name={name}
                defaultChecked={checked}
                value={option.id}
                onChange={noop}
                className="accent-primary"
              />
              <div className="flex w-full items-center justify-between gap-4">
                <div className="flex-1 text-sm text-foreground">
                  {option.text}
                </div>
              </div>
              {mode == "edit" && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(index);
                  }}
                  size="icon"
                  className="size-6! hover:bg-destructive/10! hover:text-destructive! text-muted-foreground"
                  variant="ghost"
                >
                  <XIcon className="size-3!" />
                </Button>
              )}
            </div>
          );
        }

        return (
          <InDevelopment key={option.id} className="w-full text-sm h-48">
            아직 지원하지 않는 옵션 입니다.
          </InDevelopment>
        );
      })}
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

  return (
    <div className="flex flex-col gap-3">
      {content.options.map((option, index) => {
        if (option.type == "text") {
          const name = `block-option-${option.id}`;
          const checked = answer?.answer.includes(option.id);
          const isSelected =
            mode == "solve" && submit?.answer?.includes(option.id);

          return (
            <div
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 transition-colors",
                (mode == "edit" || mode == "solve") && "cursor-pointer",
                isSelected &&
                  isCorrect == false &&
                  "border-destructive bg-destructive/10",
                mode != "solve" && checked
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-accent",
              )}
            >
              <input
                type="checkbox"
                name={name}
                checked={checked}
                value={option.id}
                className="accent-primary"
              />
              <div className="flex w-full items-center justify-between gap-4">
                <div className="flex-1 text-sm text-foreground">
                  {option.text}
                </div>
              </div>
              {mode == "edit" && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(index);
                  }}
                  size="icon"
                  className="size-6! hover:bg-destructive/10! hover:text-destructive! text-muted-foreground"
                  variant="ghost"
                >
                  <XIcon className="size-3!" />
                </Button>
              )}
            </div>
          );
        }

        return (
          <InDevelopment key={option.id} className="w-full text-sm h-48">
            아직 지원하지 않는 옵션 입니다.
          </InDevelopment>
        );
      })}
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
