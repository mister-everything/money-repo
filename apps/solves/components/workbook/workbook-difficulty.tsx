import {
  getWorkBookDifficulty,
  WorkBookDifficultyLevel,
} from "@service/solves/shared";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export function WorkbookDifficulty({
  count = 0,
  sum = 0,
}: {
  count?: number;
  sum?: number;
}) {
  const difficulty = useMemo(() => {
    return getWorkBookDifficulty({
      firstScoreSum: sum,
      firstSolverCount: count,
    });
  }, [count, sum]);

  const textClassName = useMemo(() => {
    if (count < 10) return "text-fuchsia-700";
    if (difficulty.difficulty === WorkBookDifficultyLevel.VERY_EASY)
      return "text-primary";
    if (difficulty.difficulty === WorkBookDifficultyLevel.EASY)
      return "text-primary";
    if (difficulty.difficulty === WorkBookDifficultyLevel.NORMAL)
      return "text-point";
    if (difficulty.difficulty === WorkBookDifficultyLevel.HARD)
      return "text-destructive";
    return "text-destructive";
  }, [count, difficulty.difficulty]);

  const circleColor = useMemo(() => {
    if (count < 10) return "bg-fuchsia-700";
    if (difficulty.difficulty === WorkBookDifficultyLevel.VERY_EASY)
      return "bg-primary";
    if (difficulty.difficulty === WorkBookDifficultyLevel.EASY)
      return "bg-primary";
    if (difficulty.difficulty === WorkBookDifficultyLevel.NORMAL)
      return "bg-point";
    if (difficulty.difficulty === WorkBookDifficultyLevel.HARD)
      return "bg-destructive";
    return "bg-destructive";
  }, [count, difficulty.difficulty]);

  const levelToNumber = useMemo(() => {
    if (difficulty.difficulty === WorkBookDifficultyLevel.VERY_EASY) return 1;
    if (difficulty.difficulty === WorkBookDifficultyLevel.EASY) return 2;
    if (difficulty.difficulty === WorkBookDifficultyLevel.NORMAL) return 3;
    if (difficulty.difficulty === WorkBookDifficultyLevel.HARD) return 4;
    return 5;
  }, [difficulty.difficulty]);

  return (
    <div className={cn("text-xs flex items-center gap-2", textClassName)}>
      {count > 10 && (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "size-2 rounded-full",
                index < levelToNumber ? circleColor : "bg-input",
              )}
            />
          ))}
        </div>
      )}
      <span>{difficulty.label}</span>
      <span className="text-[10px] text-muted-foreground truncate">
        {`(${difficulty.detail})`}
      </span>
    </div>
  );
}
