"use client";

import { isNull } from "@workspace/util";
import { CheckIcon } from "lucide-react";
import { ComponentProps, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type SolveModeSelectorProps = {
  onModeSelect?: (mode: "all" | "sequential") => void;
  initialMode?: "all" | "sequential";
  totalCount?: number;
  currentCount?: number;
} & ComponentProps<"div">;

export function SolveModeSelector({
  onModeSelect,
  className,
  initialMode,
  totalCount = 0,
  currentCount = 0,
  ...cardProps
}: SolveModeSelectorProps) {
  const [mode, setMode] = useState<"all" | "sequential" | undefined>(
    initialMode,
  );

  const progress = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round((currentCount / totalCount) * 100);
  }, [currentCount, totalCount]);

  const hasProgress = currentCount > 0;

  return (
    <div className="flex flex-col gap-6">
      <div
        className={cn("border rounded-xl p-4 flex flex-col gap-4", className)}
        {...cardProps}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold mr-auto">풀이 방식 선택</span>
        </div>
        <RadioGroup
          value={mode}
          onValueChange={(value) => setMode(value as "all" | "sequential")}
        >
          <Label
            className={cn(
              "p-6 flex gap-4 rounded-lg border cursor-pointer shadow-none hover:bg-primary/5 hover:border-primary transition-colors duration-100 ease-linear",
              mode === "sequential" ? "bg-primary/5 border-primary" : "",
            )}
            htmlFor="sequential"
          >
            <div className="h-8 items-center flex">
              <RadioGroupItem value="sequential" id="sequential" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-8 items-center flex">
                <h2 className="text-lg font-bold">한 문제씩 보기</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                한 화면에 한 문제만 표시되며, 이전/다음 버튼으로 이동합니다
              </p>
              <Badge variant="secondary" className="rounded-full">
                <CheckIcon className="size-4 text-sm" />
                집중하기 좋아요
              </Badge>
            </div>
          </Label>
          <Label
            className={cn(
              "p-6 flex gap-4 rounded-lg border cursor-pointer shadow-none hover:bg-primary/5 hover:border-primary transition-colors duration-100 ease-linear",
              mode === "all" ? "bg-primary/5 border-primary" : "",
            )}
            htmlFor="all"
          >
            <div className="h-8 items-center flex">
              <RadioGroupItem value="all" id="all" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-8 items-center flex">
                <h2 className="text-lg font-bold">전체 풀이</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                모든 문제를 한 화면에 표시하고 스크롤로 자유롭게 이동합니다.
              </p>
              <Badge variant="secondary" className="rounded-full">
                <CheckIcon className="size-4 text-sm" />
                전체 파악이 쉬워요
              </Badge>
            </div>
          </Label>
        </RadioGroup>
        {hasProgress && (
          <div className="flex items-center justify-end gap-2 text-muted-foreground text-xs">
            {`${totalCount}문제 중 ${currentCount}문제 풀이완료`}

            <CircularProgress progress={progress} size={16} strokeWidth={2} />
          </div>
        )}
      </div>

      {/* Single Start Button */}
      <Button
        variant="default"
        size="lg"
        disabled={isNull(mode)}
        className="w-full font-bold text-lg py-6 gap-2"
        onClick={() => mode && onModeSelect?.(mode)}
      >
        {hasProgress ? "이어서 풀기" : "시작하기"}
      </Button>
    </div>
  );
}
