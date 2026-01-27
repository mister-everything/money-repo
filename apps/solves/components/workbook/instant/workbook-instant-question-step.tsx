import { motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { AskQuestionInput } from "@/components/chat/tool-part/ask-question-tool-part";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";
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
        <Loading />
      ) : (
        <div className="fade-2000 space-y-3 py-3">
          {/* Header */}

          <div className="flex items-center gap-2 w-full">
            <Badge className="font-bold rounded size-6">{step + 1}</Badge>
            <div className="flex-1 min-w-0">
              <span className="text-lg font-semibold block">
                <GradualSpacingText key={step} text={question?.prompt ?? ""} />
              </span>
            </div>
          </div>
          {total > 1 && (
            <p className="text-xs text-muted-foreground text-right px-2">
              {total - 1 == step
                ? "마지막 질문입니다."
                : `총 ${total}개의 질문중 ${step + 1}번째 질문입니다.`}
            </p>
          )}

          {/* Options */}
          <div className="flex flex-col gap-2">
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
                    "flex items-center gap-2 rounded-lg border p-3 text-sm transition-all",
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
              <span className="text-xs text-muted-foreground w-full text-center my-2">
                다중 선택 가능
              </span>
            )}
          </div>

          {/* 추가 메시지 입력 - 마지막 스텝에서만 표시 */}
          {isLast && (
            <div className="">
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
                size="lg"
                onClick={() => setStep((s) => s - 1)}
                className="gap-1 flex-1 shadow-none bg-input"
              >
                이전
              </Button>
            )}

            {isLast ? (
              <Button onClick={onNextStep} className="gap-1 flex-1" size="lg">
                완료
              </Button>
            ) : (
              <Button
                onClick={() => setStep((s) => s + 1)}
                className="gap-1 flex-1"
                size="lg"
              >
                {selected.length > 0 ? "다음" : "건너뛰기"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Loading() {
  const totalDuration = 8; // 전체 사이클 8초

  // 타이밍 (0~1 비율)
  const t = {
    headerStart: 0,
    headerEnd: 0.08,
    opt1Start: 0.1,
    opt1End: 0.18,
    opt2Start: 0.2,
    opt2End: 0.28,
    opt3Start: 0.3,
    opt3End: 0.38,
    opt4Start: 0.4,
    opt4End: 0.48,
    holdEnd: 0.75, // 완성 후 대기
    slideEnd: 0.9, // 슬라이드 완료
  };

  return (
    <div className="space-y-4 py-3">
      <div className="rounded-lg w-full flex items-center justify-between">
        <TextShimmer>문제 생성을 위해 필요한 질문을 생성하는 중</TextShimmer>
      </div>

      {/* 고정 높이 컨테이너 */}
      <div className="relative overflow-hidden h-[300px]">
        {/* 전체 컨테이너 - 슬라이드 */}
        <motion.div
          animate={{
            x: ["0%", "0%", "130%", "130%", "0%"],
          }}
          transition={{
            duration: totalDuration,
            times: [0, t.holdEnd, t.slideEnd, 0.95, 1],
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
          }}
          className="flex flex-col gap-3"
        >
          {/* Question Header */}
          <motion.div
            animate={{
              opacity: [0, 1, 1, 0, 0],
              y: [15, 0, 0, 0, 15],
            }}
            transition={{
              duration: totalDuration,
              times: [0, t.headerEnd, t.holdEnd, t.slideEnd, 1],
              ease: "easeOut",
              repeat: Number.POSITIVE_INFINITY,
            }}
            className="flex items-center gap-2"
          >
            <Skeleton className="h-7 w-14  shrink-0" />
            <Skeleton className="h-7 w-[65%]" />
          </motion.div>

          {/* Options */}
          <div className="flex flex-col gap-2.5">
            {[
              { start: t.opt1Start, end: t.opt1End },
              { start: t.opt2Start, end: t.opt2End },
              { start: t.opt3Start, end: t.opt3End },
              { start: t.opt4Start, end: t.opt4End },
            ].map((timing, idx) => (
              <motion.div
                key={idx}
                animate={{
                  opacity: [0, 0, 1, 1, 0, 0],
                  x: [-25, -25, 0, 0, 0, -25],
                }}
                transition={{
                  duration: totalDuration,
                  times: [
                    0,
                    timing.start,
                    timing.end,
                    t.holdEnd,
                    t.slideEnd,
                    1,
                  ],
                  ease: "easeOut",
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                <Skeleton className="h-12 w-full rounded-lg" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
