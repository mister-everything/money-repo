"use client";
import { ChevronDownIcon, LightbulbIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { WorkBookComponentMode } from "../types";

export function BlockSolution({
  solution,
  mode,
  onChangeSolution,
}: {
  solution: string;
  mode: WorkBookComponentMode;
  onChangeSolution?: (solution: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleToggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

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

  if (!solution.trim()) return null;

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
        <span className="ml-2 font-semibold">
          {isExpanded ? "해설" : "해설 보기"}
        </span>
        <Button variant="ghost" size="icon" className="ml-auto">
          {isExpanded ? <LightbulbIcon /> : <ChevronDownIcon />}
        </Button>
      </div>

      {isExpanded && (
        <div className="px-2 pb-2">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
            {solution.trim() || "해설이 없습니다."}
          </p>
        </div>
      )}
    </div>
  );
}
