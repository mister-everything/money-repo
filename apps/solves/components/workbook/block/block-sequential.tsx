"use client";

import {
  ChevronLeft,
  ChevronRight,
  LoaderIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { RefCallback, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Block, BlockProps } from "./block";

type BlockSequentialProps = {
  onNext: () => void;
  onPrevious: () => void;
  onSubmit?: () => void;
  totalCount: number;
  currentIndex: number;
  isPending: boolean;
  blockProps?: BlockProps;
};

export function BlockSequential({
  isPending,
  onNext,
  onPrevious,
  onSubmit,
  totalCount,
  currentIndex,
  blockProps,
}: BlockSequentialProps) {
  const scrollToBlock = useCallback<RefCallback<HTMLDivElement>>(
    (node) => {
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [currentIndex],
  );

  const progress = useMemo(() => {
    const value = ((currentIndex + 1) / totalCount) * 100;
    return value ?? 100;
  }, [currentIndex, totalCount]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            {totalCount > 0
              ? `문제 ${currentIndex + 1} / ${totalCount}`
              : "문제가 없습니다."}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {blockProps ? (
        <Block
          key={blockProps.id}
          {...blockProps}
          className="min-h-60"
          ref={scrollToBlock}
        />
      ) : (
        <div className="text-center flex flex-col items-center gap-4 text-muted-foreground py-24 border border-dashed rounded-xl">
          <TriangleAlertIcon className="size-12" />
          문제가 없습니다.
        </div>
      )}

      {/* 네비게이션 버튼 */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={onPrevious}
            disabled={currentIndex === 0}
            variant="ghost"
            size="lg"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>

          {currentIndex === totalCount - 1 ? (
            <Button
              onClick={onSubmit}
              disabled={isPending}
              size="lg"
              className="px-8 py-3 bg-primary font-bold text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground/90 hover:border-primary/90"
            >
              {isPending && <LoaderIcon className="size-4 animate-spin" />}
              제출하고 결과 보기
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={currentIndex === totalCount - 1}
              variant="secondary"
              size="lg"
              className="flex items-center gap-2"
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
