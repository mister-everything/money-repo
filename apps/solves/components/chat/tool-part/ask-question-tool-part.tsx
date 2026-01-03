import { UIMessage, UseChatHelpers } from "@ai-sdk/react";
import { getToolName, ToolUIPart } from "ai";
import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleDotIcon,
  CornerDownLeftIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import z from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GradualSpacingText } from "@/components/ui/gradual-spacing-text";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { DeepPartial } from "@/global";
import { ToolCanceledMessage } from "@/lib/ai/shared";
import { askQuestionInputSchema } from "@/lib/ai/tools/workbook/ask-question-tools";
import { cn } from "@/lib/utils";

export type AskQuestionInput = z.infer<typeof askQuestionInputSchema>;
export type AskQuestionOutput = {
  answers: Array<{
    questionId: string;
    selectedOptionIds: string[];
  }>;
  additionalMessage?: string;
};

interface AskQuestionToolPartProps {
  part: ToolUIPart;
}

const getOptionLabel = (index: number) => String.fromCharCode(65 + index);

export function AskQuestionToolPart({ part }: AskQuestionToolPartProps) {
  const input = part.input as DeepPartial<AskQuestionInput> | undefined;
  const questions = useMemo(
    () => (input?.questions ?? []).filter(Boolean),
    [input?.questions],
  );

  const isStreaming = part.state === "input-streaming";
  const isPending = part.state === "input-available";
  const isDone = part.state.startsWith("output-");

  const output = part.output as string | AskQuestionOutput | undefined;
  const isSkipped = output === ToolCanceledMessage;

  // output에서 선택된 optionIds 추출
  const selectedMap = useMemo(() => {
    if (!isDone || isSkipped || typeof output === "string" || !output)
      return {};
    const map: Record<string, string[]> = {};
    for (const item of output?.answers ?? []) {
      map[item.questionId] = item.selectedOptionIds;
    }
    return map;
  }, [isDone, isSkipped, output]);

  // additionalMessage 추출
  const additionalMessageFromOutput = useMemo(() => {
    if (!isDone || isSkipped || typeof output === "string" || !output)
      return "";
    return output.additionalMessage ?? "";
  }, [isDone, isSkipped, output]);

  if (part.errorText) {
    return (
      <div className="text-sm text-muted-foreground">
        <p className="fade-300">질문 생성을 실패하였습니다.</p>
      </div>
    );
  }

  // 상태 아이콘 & 메시지
  const StatusHeader = () => {
    if (isStreaming) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <TextShimmer>질문 생성중</TextShimmer>
        </div>
      );
    }
    if (isPending) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <CircleDotIcon className="size-4 animate-pulse text-primary" />
          <span>
            {questions.length}개의 질문이 있어요.{" "}
            <span className="text-primary font-medium">
              아래에서 답변해주세요.
            </span>
          </span>
        </div>
      );
    }
    if (isSkipped) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <XCircleIcon className="size-4 text-muted-foreground" />
          <span>질문을 건너뛰었어요.</span>
        </div>
      );
    }
    // 완료
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <CheckCircle2Icon className="size-4 text-primary" />
        <span>답변이 전송되었어요.</span>
      </div>
    );
  };

  return (
    <div className="text-sm space-y-3 ">
      <StatusHeader />

      {/* 질문 목록 - 항상 표시 */}
      {questions.length > 0 && (
        <div className="space-y-2 pl-6 mb-8">
          {questions.map((q, qIdx) => {
            const qId = q?.id ?? "";
            const options = (q?.options ?? []).filter(Boolean);
            const selectedIds = selectedMap[qId] ?? [];

            return (
              <div
                key={qId || qIdx}
                className={cn(
                  "space-y-1.5 transition-opacity",
                  isStreaming && "animate-pulse",
                  isSkipped && "opacity-50",
                )}
              >
                {/* 질문 */}
                <div className="flex items-start gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs shrink-0",
                      isPending && "animate-pulse",
                    )}
                  >
                    Q{qIdx + 1}
                  </Badge>
                  <span className="text-muted-foreground">{q?.prompt}</span>
                </div>

                {/* 옵션들 */}
                <div className="flex flex-wrap gap-1.5 pl-8">
                  {options.map((opt, oIdx) => {
                    const oId = opt?.id ?? "";
                    const isSelected = selectedIds.includes(oId);
                    const letter = getOptionLabel(oIdx);

                    return (
                      <Badge
                        key={oId || oIdx}
                        variant="outline"
                        className={cn(
                          "text-xs transition-all max-w-full",
                          // 완료 상태에서 선택된 것
                          isDone &&
                            !isSkipped &&
                            isSelected &&
                            "border-primary bg-primary/10 text-primary",
                          // 완료 상태에서 선택 안된 것
                          isDone && !isSkipped && !isSelected && "opacity-40",
                          // 대기 중
                          isPending && "animate-pulse",
                          // 스트리밍 중
                          isStreaming && "opacity-60",
                          // 건너뜀
                          isSkipped && "opacity-40",
                        )}
                      >
                        <span
                          className={cn(
                            "font-bold mr-1",
                            isSelected && "text-primary",
                          )}
                        >
                          {letter}
                        </span>
                        <span className="min-w-0 truncate">{opt?.label}</span>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 추가 메시지 - 완료 상태에서만 표시 */}
      {isDone && !isSkipped && additionalMessageFromOutput && (
        <div className="pl-6 text-muted-foreground text-xs italic">
          "{additionalMessageFromOutput}"
        </div>
      )}
    </div>
  );
}

type SelectionMap = Record<string, string[]>;

interface AskQuestionInteractionProps {
  part: ToolUIPart;
  addToolOutput: UseChatHelpers<UIMessage>["addToolOutput"];
  cancelTool: () => void;
}

export function AskQuestionInteraction({
  part,
  addToolOutput,
  cancelTool,
}: AskQuestionInteractionProps) {
  const input = part.input as DeepPartial<AskQuestionInput> | undefined;
  const questions = useMemo(
    () => (input?.questions ?? []).filter(Boolean),
    [input?.questions],
  );

  const toolName = useMemo(() => getToolName(part), [part]);

  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<SelectionMap>({});
  const [additionalMessage, setAdditionalMessage] = useState("");

  const total = questions.length;
  const question = questions[step];
  const qId = question?.id ?? "";
  const isMultiple = question?.allow_multiple ?? false;
  const selected = selections[qId] ?? [];
  const options = useMemo(
    () => (question?.options ?? []).filter(Boolean),
    [question?.options],
  );

  // 초기화
  useEffect(() => {
    const init: SelectionMap = {};
    for (const q of questions) {
      if (q?.id) init[q.id] = [];
    }
    setSelections(init);
    setStep(0);
  }, [questions]);

  const handleSelect = useCallback(
    (optionId: string) => {
      setSelections((prev) => {
        const current = prev[qId] ?? [];
        if (isMultiple) {
          return {
            ...prev,
            [qId]: current.includes(optionId)
              ? current.filter((id) => id !== optionId)
              : [...current, optionId],
          };
        }
        return { ...prev, [qId]: [optionId] };
      });
    },
    [qId, isMultiple],
  );

  const handleSubmit = useCallback(() => {
    const output: AskQuestionOutput = {
      answers: Object.entries(selections).map(([questionId, optionIds]) => ({
        questionId,
        selectedOptionIds: optionIds,
      })),
      additionalMessage: additionalMessage.trim() || undefined,
    };
    addToolOutput({
      toolCallId: part.toolCallId,
      tool: toolName,
      state: "output-available",
      output,
    });
  }, [addToolOutput, part.toolCallId, selections, toolName, additionalMessage]);

  if (total === 0) return null;

  const isFirst = step === 0;
  const isLast = step === total - 1;

  return (
    <div className="fade-2000 space-y-3 p-3 bg-muted/50 rounded-xl slide-in-from-bottom-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 w-full">
          <Badge className="rounded-full">
            Q{step + 1}
            {total > 1 && <span className="opacity-60">/{total}</span>}
          </Badge>
          <div className="flex-1 min-w-0">
            <span className="text font-semibold block">
              <GradualSpacingText key={step} text={question?.prompt ?? ""} />
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 ml-auto"
            onClick={cancelTool}
            title="건너뛰기"
          >
            <XIcon className="size-4" />
          </Button>
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
                {getOptionLabel(idx)}
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
            value={additionalMessage}
            onChange={(e) => setAdditionalMessage(e.target.value)}
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
          <Button onClick={handleSubmit} className="gap-1">
            전송
            <CornerDownLeftIcon className="size-4" />
          </Button>
        ) : (
          <>
            <Button onClick={() => setStep((s) => s + 1)} className="gap-1">
              다음
              <ChevronRightIcon className="size-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
