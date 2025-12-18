"use client";

import { HeartIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toggleWorkBookLikeAction } from "@/actions/workbook";
import { AnimatedToggleButton } from "@/components/ui/animated-toggle-button";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";

export function WorkBookLikeButton({
  workBookId,
  initialIsLiked,
  initialLikeCount,
  className,
  iconCount = 10,
}: {
  workBookId: string;
  initialIsLiked?: boolean;
  initialLikeCount?: number;
  className?: string;
  iconCount?: number;
}) {
  const [isLiked, setIsLiked] = useState(Boolean(initialIsLiked));
  const [likeCount, setLikeCount] = useState(initialLikeCount ?? 0);

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

  const handleActiveChange = useCallback(
    (newIsLiked: boolean) => {
      if (isPending) return;
      setIsLiked(newIsLiked);
      setLikeCount((prev) => Math.max(0, prev + (newIsLiked ? 1 : -1)));
      toggleLike({ workBookId });
    },
    [isPending, toggleLike, workBookId],
  );

  return (
    <div className="flex items-center flex-col gap-1">
      <AnimatedToggleButton
        burstIcon={HeartIcon}
        iconCount={iconCount}
        active={isLiked}
        defaultActive={Boolean(initialIsLiked)}
        onActiveChange={handleActiveChange}
        variant="outline"
        size="icon"
        className={className}
        burstIconClassName="fill-destructive text-destructive"
        aria-label={isLiked ? "좋아요 취소" : "좋아요"}
      >
        <HeartIcon
          className={cn(
            "size-4 transition-colors",
            isLiked
              ? "fill-destructive text-destructive"
              : "text-muted-foreground",
          )}
        />
      </AnimatedToggleButton>
      <span className="tabular-nums text-2xs text-muted-foreground">
        {likeCount}
      </span>
    </div>
  );
}
