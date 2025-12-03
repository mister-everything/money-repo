"use client";
import {
  BlockAnswer,
  BlockContent,
  BlockType,
  McqBlockContent,
  RankingBlockContent,
} from "@service/solves/shared";
import { toAny } from "@workspace/util";
import { ChevronDownIcon, LightbulbIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { WorkBookComponentMode } from "../types";

export function BlockSolution<T extends BlockType = BlockType>({
  solution,
  mode,
  onChangeSolution,
  answer,
  content,
}: {
  solution: string;
  mode: WorkBookComponentMode;
  content: BlockContent<T>;
  onChangeSolution?: (solution: string) => void;
  answer?: BlockAnswer<T>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleToggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const correctAnswerMessage = useMemo(() => {
    if (answer?.type == "default")
      return <span>{answer?.answer?.join(" ") || "정답이 없습니다."}</span>;

    if (answer?.type == "mcq") {
      if (!answer?.answer?.length) return <span>정답이 없습니다.</span>;
      const option = (content as McqBlockContent)?.options ?? [];
      const index = option.findIndex((option) => option.id == answer.answer);
      if (index == -1) return <span>정답이 없습니다.</span>;
      return (
        <span>
          {index + 1} {toAny(option[index]).text}
        </span>
      );
    }
    if (answer?.type == "mcq-multiple") {
      if (!answer?.answer?.length) return <span>정답이 없습니다.</span>;
      const option = ((content as McqBlockContent)?.options ?? []).map(
        (v, index) => ({
          ...v,
          index,
        }),
      );
      const correctOptions = option.filter((option) =>
        answer.answer.includes(option.id),
      );

      return (
        <span>
          {correctOptions
            .map((option) => `${option.index + 1} ${toAny(option).text}`)
            .join(", ")}
        </span>
      );
    }
    if (answer?.type == "ox") {
      return <span>{answer.answer ? "O" : "X"}</span>;
    }
    if (answer?.type == "ranking") {
      const options = (content as RankingBlockContent)?.items ?? [];
      if (!options.length || !answer.order?.length)
        return <span>정답이 없습니다.</span>;
      const sortedOptions = options.sort(
        (a, b) => answer.order.indexOf(a.id) - answer.order.indexOf(b.id),
      );
      return <span>{sortedOptions.map((v) => toAny(v).text).join(" ")}</span>;
    }
    return <span>지원되지 않는 유형입니다.</span>;
  }, [answer, content]);

  useEffect(() => {
    setIsExpanded(false);
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
            <Separator className="my-4" />
            <div className="flex gap-2 w-full">
              <Button className="flex-1">직접 작성하기</Button>
              <Button
                variant={"secondary"}
                className="flex-1 bg-input hover:bg-input/70"
              >
                AI 챗봇으로 생성하기
              </Button>
            </div>
            <div className="mt-2">
              <Textarea
                placeholder={`문제에 대한 설명을 직접 입력하세요

예) 대한민국의 수도는 서울특별시입니다. 1394년 조선시대부터 수도로...`}
                autoFocus
                value={solution}
                className="min-h-[100px] max-h-[300px] bg-background resize-none shadow-none"
                onChange={(e) => onChangeSolution?.(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <p className="px-2 text-xs text-muted-foreground truncate min-w-0">
            {solution}
          </p>
        )}
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
          <div className="px-2 pb-2 flex flex-col gap-2 text-muted-foreground">
            <div className="flex gap-2">
              <span className="w-16 text-muted-foreground/50 font-semibold">
                정답
              </span>
              {correctAnswerMessage}
            </div>
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
