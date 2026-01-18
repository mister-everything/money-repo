"use client";
import {
  BlockAnswer,
  BlockAnswerSubmit,
  BlockContent,
  BlockType,
  McqBlockAnswerSubmit,
  McqBlockContent,
  OxBlockAnswerSubmit,
  RankingBlockContent,
} from "@service/solves/shared";
import { toAny } from "@workspace/util";
import {
  ChevronDownIcon,
  CircleIcon,
  LightbulbIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { WorkBookComponentMode } from "./types";

export function BlockSolution<T extends BlockType = BlockType>({
  solution,
  mode,
  onChangeSolution,
  answer,
  content,
  submit,
  isCorrect,
  isSuggest = false,
  onAcceptSuggest,
  onRejectSuggest,
}: {
  blockId?: string;
  question: string;
  solution: string;
  mode: WorkBookComponentMode;
  content: BlockContent<T>;
  onChangeSolution?: (solution: string) => void;
  answer?: BlockAnswer<T>;
  submit?: BlockAnswerSubmit<T>;
  isCorrect?: boolean;
  isSuggest?: boolean;
  onAcceptSuggest?: () => void;
  onRejectSuggest?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleToggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const correctAnswerMessage = useMemo(() => {
    if (answer?.type == "default")
      return (
        <div className="flex gap-2 text-primary font-semibold items-center">
          <span className="w-16">여러 정답</span>
          {answer?.answer.length ? (
            <div className="flex gap-3">
              {answer?.answer.map((a, index) => (
                <span key={index}>{a}</span>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">정답이 없습니다.</span>
          )}
        </div>
      );

    if (answer?.type == "mcq") {
      const option = (content as McqBlockContent)?.options ?? [];
      const correctIndex = option.findIndex(
        (option) => option.id == answer?.answer,
      );
      const submitIndex = option.findIndex(
        (option) => option.id == (submit as McqBlockAnswerSubmit)?.answer,
      );

      return (
        <>
          {mode == "review" && !isCorrect && (
            <div className="flex gap-2 text-destructive font-semibold items-center">
              <span className="w-16">내가 고른 답 </span>
              <div className="flex gap-3">
                {submitIndex == -1 ? (
                  <span className="text-muted-foreground">
                    정답을 제출하지 않았습니다.
                  </span>
                ) : (
                  <div className="flex gap-1 items-center">
                    <div className="size-3.5 text-[10px] rounded-full border border-destructive text-destructive flex items-center justify-center">
                      {submitIndex + 1}
                    </div>
                    {toAny(option[submitIndex]).text}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-2 text-primary font-semibold items-center">
            <span className="w-16">정답 </span>
            <div className="flex gap-3">
              {correctIndex == -1 ? (
                <span className="text-muted-foreground">정답이 없습니다.</span>
              ) : (
                <div className="flex gap-1 items-center">
                  <div className="size-3.5 text-[10px] rounded-full border border-primary text-primary flex items-center justify-center">
                    {correctIndex + 1}
                  </div>
                  {toAny(option[correctIndex]).text}
                </div>
              )}
            </div>
          </div>
        </>
      );
    }
    if (answer?.type == "mcq-multiple") {
      const option = ((content as McqBlockContent)?.options ?? []).map(
        (option, index) => ({ ...option, index }),
      );
      const correctIndex = option.filter((option) =>
        answer?.answer?.includes(option.id),
      );
      const submitIndex = option.filter((option) =>
        (submit as McqBlockAnswerSubmit)?.answer?.includes(option.id),
      );

      return (
        <>
          {mode == "review" && !isCorrect && (
            <div className="flex gap-2 text-destructive font-semibold items-center">
              <span className="w-16">내가 고른 답 </span>
              <div className="flex gap-3">
                {submitIndex.length == 0 ? (
                  <span className="text-muted-foreground">
                    정답을 제출하지 않았습니다.
                  </span>
                ) : (
                  <div className="flex gap-3 flex-wrap">
                    {submitIndex.map((v) => (
                      <div className="flex items-center gap-1" key={v.id}>
                        <div className="size-3.5 text-[10px] rounded-full border border-destructive text-destructive flex items-center justify-center">
                          {v.index + 1}
                        </div>
                        {toAny(v).text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-2 text-primary font-semibold items-center">
            <span className="w-16">정답 </span>
            <div className="flex gap-3">
              {correctIndex.length == 0 ? (
                <span className="text-muted-foreground">정답이 없습니다.</span>
              ) : (
                <div className="flex gap-3 flex-wrap">
                  {correctIndex.map((v) => (
                    <div className="flex items-center gap-1" key={v.id}>
                      <div className="size-3.5 text-[10px] rounded-full border border-primary text-primary flex items-center justify-center">
                        {v.index + 1}
                      </div>
                      {toAny(v).text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      );
    }
    if (answer?.type == "ox") {
      return (
        <>
          {mode == "review" && !isCorrect && (
            <div className="flex gap-2 text-destructive font-semibold items-center">
              <span className="w-16">내가 고른 답</span>
              <div className="flex gap-3">
                {(submit as OxBlockAnswerSubmit)?.answer == undefined ? (
                  <span className="text-muted-foreground">
                    정답을 제출하지 않았습니다.
                  </span>
                ) : (
                  <div className="flex gap-3 flex-wrap">
                    {(submit as OxBlockAnswerSubmit)?.answer ? (
                      <CircleIcon className="size-2.5 stroke-3" />
                    ) : (
                      <XIcon className="size-2.5 stroke-3" />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-2 text-primary font-semibold items-center">
            <span className="w-16">정답 </span>

            <div className="flex gap-3">
              {answer?.answer ? (
                <CircleIcon className="size-2.5 stroke-3" />
              ) : (
                <XIcon className="size-2.5 stroke-3" />
              )}
            </div>
          </div>
        </>
      );
    }
    if (answer?.type == "ranking") {
      const options = [...((content as RankingBlockContent)?.items ?? [])].sort(
        (a, b) => answer.order.indexOf(a.id) - answer.order.indexOf(b.id),
      );
      return (
        <div className="flex gap-2 text-primary font-semibold items-center">
          <span className="w-16">정답 순서</span>
          {!options.length || !answer.order?.length ? (
            <span className="text-muted-foreground">정답이 없습니다.</span>
          ) : (
            <div className="flex gap-3">
              {options.map((v) => {
                if (v.type != "text")
                  return <span key={v.id}>지원되지 않는 유형</span>;
                return <span key={v.id}>{v.text}</span>;
              })}
            </div>
          )}
        </div>
      );
    }
    return <span>지원되지 않는 유형입니다.</span>;
  }, [answer, content]);

  useEffect(() => {
    setIsExpanded(mode == "review");
  }, [mode]);
  if (mode == "solve") return null;

  if (mode == "edit")
    return (
      <div
        className={cn(
          "w-full border rounded-lg bg-secondary px-2 py-3 flex flex-col transition-colors",
          !isExpanded && "cursor-pointer hover:bg-input",
        )}
      >
        <div
          className={cn("flex items-center justify-between")}
          onClick={handleToggleExpanded}
        >
          <span className="ml-2 font-semibold">해설 추가</span>
          <Button variant="ghost" size="icon" className="ml-auto">
            <ChevronDownIcon
              className={cn("transition-transform", isExpanded && "rotate-180")}
            />
          </Button>
        </div>
        {isExpanded ? (
          <div className="px-2 pb-2">
            <p className="text-xs text-muted-foreground">
              학습자가 이해하기 쉽도록 자세히 작성해주세요
            </p>
            <div className="mt-2">
              <Textarea
                value={solution || ""}
                autoFocus
                className="resize-none max-h-[200px] shadow-none bg-background border-none"
                onChange={(e) => {
                  onChangeSolution?.(e.currentTarget.value);
                }}
                placeholder={`해설을 작성해주세요.`}
              />
            </div>
          </div>
        ) : (
          <p className="px-2 text-xs text-muted-foreground truncate min-w-0">
            {answer?.solution ?? "해설이 없습니다."}
          </p>
        )}
      </div>
    );

  if (isSuggest)
    return (
      <div className="px-2 pb-2 flex flex-col gap-4 text-muted-foreground text-xs">
        {(onAcceptSuggest || onRejectSuggest) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-auto">해설</span>
            {onRejectSuggest && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs text-destructive hover:text-destructive"
                onClick={onRejectSuggest}
              >
                Reject
              </Button>
            )}
            {onAcceptSuggest && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs text-primary hover:text-primary hover:bg-primary/10"
                onClick={onAcceptSuggest}
              >
                Accept
              </Button>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <span className="w-16 text-muted-foreground/50 font-semibold">
            해설
          </span>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {solution.trim() || "해설이 없습니다."}
          </p>
        </div>
      </div>
    );

  return (
    <div className="w-full border-t">
      <div
        className={cn(
          "w-full rounded-lg px-2 py-3 flex flex-col transition-colors text-sm mt-2",
          !isExpanded && "cursor-pointer hover:bg-input",
        )}
      >
        <div
          className={cn("flex items-center justify-between")}
          onClick={handleToggleExpanded}
        >
          <span className="ml-2 font-semibold">정답 및 해설</span>
          <Button variant="ghost" size="icon" className="ml-auto">
            {isExpanded ? <LightbulbIcon /> : <ChevronDownIcon />}
          </Button>
        </div>

        {isExpanded && (
          <div className="px-2 pb-2 flex flex-col gap-4 text-muted-foreground text-xs">
            {correctAnswerMessage}
            <div className="flex gap-2">
              <span className="w-16 text-muted-foreground/50 font-semibold">
                해설
              </span>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {solution.trim() || "해설이 없습니다."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
