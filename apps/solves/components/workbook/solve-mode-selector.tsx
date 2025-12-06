"use client";

import { isNull } from "@workspace/util";
import { CheckIcon } from "lucide-react";
import { ComponentProps, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

type SolveModeSelectorProps = {
  onModeSelect?: (mode: "all" | "sequential") => void;
  initialMode?: "all" | "sequential";
} & ComponentProps<"div">;

export function SolveModeSelector({
  onModeSelect,
  className,
  initialMode,
  ...cardProps
}: SolveModeSelectorProps) {
  const [mode, setMode] = useState<"all" | "sequential" | undefined>(
    initialMode,
  );

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn("border rounded-xl p-4 gap-4", className)}
        {...cardProps}
      >
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
      </div>
      <Button
        variant="default"
        size={"lg"}
        disabled={isNull(mode)}
        className="w-full font-bold text-lg py-6"
        onClick={() => mode && onModeSelect?.(mode)}
      >
        시작하기
      </Button>
    </div>
  );
}
