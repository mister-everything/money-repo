import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CornerDownLeftIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AskQuestionInput } from "@/components/chat/tool-part/ask-question-tool-part";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { AskQuestionOutput } from "@/lib/ai/tools/workbook/ask-question-tools";
import { cn } from "@/lib/utils";
import { GradualSpacingText } from "../../ui/gradual-spacing-text";

export function WorkbookInstantQuestionStep({
  input,
  output,
  onChangeOutput,
  onNextStep,
  isLoading,
}: {
  input?: AskQuestionInput;
  output?: AskQuestionOutput;
  onChangeOutput: (output: AskQuestionOutput) => void;
  onNextStep: () => void;
  isLoading: boolean;
}) {
  const questions = useMemo(
    () => (input?.questions ?? []).filter(Boolean),
    [input?.questions],
  );
  const [step, setStep] = useState(0);

  const total = questions.length;
  const question = questions[step];
  const qId = question?.id ?? "";
  const isMultiple = question?.allow_multiple ?? false;
  const selected =
    output?.answers.find((answer) => answer.questionId === qId)
      ?.selectedOptionIds ?? [];
  const options = useMemo(
    () => (question?.options ?? []).filter(Boolean),
    [question?.options],
  );

  const handleSelect = useCallback(
    (optionId: string) => {
      const prev = output ?? ({ answers: [] } as AskQuestionOutput);
      const prevOption = prev.answers?.find(
        (answer) => answer.questionId == qId,
      ) ?? { questionId: qId, selectedOptionIds: [] };

      const nextOption = prevOption.selectedOptionIds.includes(optionId)
        ? prevOption.selectedOptionIds.filter((id) => id !== optionId)
        : isMultiple
          ? [...prevOption.selectedOptionIds, optionId]
          : [optionId];

      const hasAnswer = prev.answers.some(
        (answer) => answer.questionId === qId,
      );

      onChangeOutput({
        ...prev,
        answers: hasAnswer
          ? prev.answers.map((answer) =>
              answer.questionId === qId
                ? { ...answer, selectedOptionIds: nextOption }
                : answer,
            )
          : [
              ...prev.answers,
              { questionId: qId, selectedOptionIds: nextOption },
            ],
      });
    },
    [qId, isMultiple, output],
  );

  const isFirst = step === 0;
  const isLast = step === total - 1;

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="rounded-2xl px-4 py-3 text-sm">
          <TextShimmer>필요한 질문을 준비하고 있어요</TextShimmer>
        </div>
      ) : (
        <div className="fade-2000 space-y-3 p-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 w-full">
              <Badge className="rounded-full">
                Q{step + 1}
                {total > 1 && <span className="opacity-60">/{total}</span>}
              </Badge>
              <div className="flex-1 min-w-0">
                <span className="text font-semibold block">
                  <GradualSpacingText
                    key={step}
                    text={question?.prompt ?? ""}
                  />
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar - 2개 이상일 때만 표시 */}
          {total > 1 && (
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((step + 1) / total) * 100}%` }}
              />
            </div>
          )}

          {/* Options */}
          <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto">
            {options.map((opt, idx) => {
              const oId = opt?.id ?? "";
              const oLabel = opt?.label ?? "";
              const isSelected = selected.includes(oId);

              return (
                <button
                  key={`${qId}-${oId}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(oId)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted bg-background hover:border-primary/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded text-xs font-bold",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted-foreground/20 text-muted-foreground",
                    )}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{oLabel}</span>
                </button>
              );
            })}
            {isMultiple && (
              <span className="text-xs text-muted-foreground w-full text-center">
                다중 선택 가능
              </span>
            )}
          </div>

          {/* 추가 메시지 입력 - 마지막 스텝에서만 표시 */}
          {isLast && (
            <div className="pt-2">
              <textarea
                value={output?.additionalMessage ?? ""}
                onChange={(e) =>
                  onChangeOutput({
                    ...(output ?? { answers: [] }),
                    additionalMessage: e.target.value,
                  })
                }
                placeholder="추가로 전달할 내용이 있다면 입력해주세요 (선택)"
                className="w-full text-sm bg-background border rounded-lg px-3 py-2 resize-none placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                rows={2}
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
                className="gap-1"
              >
                <ChevronLeftIcon className="size-4" />
                이전
              </Button>
            )}
            <div className="flex-1" />
            {isLast ? (
              <Button onClick={onNextStep} className="gap-1">
                완료
                <CornerDownLeftIcon className="size-4" />
              </Button>
            ) : (
              <Button onClick={() => setStep((s) => s + 1)} className="gap-1">
                다음
                <ChevronRightIcon className="size-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
