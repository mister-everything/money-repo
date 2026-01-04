"use client";

import { WorkBookWithoutBlocks } from "@service/solves/shared";
import { HeartIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toggleWorkBookLikeAction } from "@/actions/workbook";
import { Button } from "@/components/ui/button";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";
import { WorkbookCard } from "./workbook-card";
import { WorkbookReportDialog } from "./workbook-report-dialog";

interface WorkbookRecommendationsProps {
  workBookId: string;
  likeCount: number;
  isLiked: boolean;
  recommendations: WorkBookWithoutBlocks[];
}

export function WorkbookRecommendations({
  workBookId,
  likeCount: initialLikeCount,
  isLiked: initialIsLiked,
  recommendations,
}: WorkbookRecommendationsProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  const [, toggleLike, isPending] = useSafeAction(toggleWorkBookLikeAction, {
    failMessage: "좋아요 처리에 실패했어요.",
    onSuccess: (data) => {
      setIsLiked(data.isLiked);
      setLikeCount((prev) => {
        if (typeof data.count === "number") return data.count;
        return Math.max(0, prev + (data.isLiked ? 1 : -1));
      });
    },
  });

  const handleLikeClick = useCallback(() => {
    if (isPending) return;
    setIsLiked((prev) => !prev);
    setLikeCount((prev) => Math.max(0, prev + (isLiked ? -1 : 1)));
    toggleLike({ workBookId });
  }, [isPending, isLiked, toggleLike, workBookId]);

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Header with likes and report */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleLikeClick}
          disabled={isPending}
        >
          <HeartIcon
            className={cn(
              "size-4",
              isLiked ? "fill-destructive text-destructive" : "",
            )}
          />
          <span className="text-sm">좋아요 {likeCount}</span>
        </Button>
        <WorkbookReportDialog workbookId={workBookId}>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            신고하기
          </Button>
        </WorkbookReportDialog>
      </div>

      {/* Title */}
      <div className="border-t pt-4">
        <h3 className="text-xl font-bold text-foreground">
          비슷한 문제집 둘러보기
        </h3>
      </div>

      {/* Recommended workbooks grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((workBook) => (
          <Link key={workBook.id} href={`/workbooks/${workBook.id}/preview`}>
            <WorkbookCard workBook={workBook} />
          </Link>
        ))}
      </div>
    </div>
  );
}
