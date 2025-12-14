"use client";

import { AnimationSequence, useAnimate } from "framer-motion";

import { HeartIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toggleWorkBookLikeAction } from "@/actions/workbook";
import { Button } from "@/components/ui/button";
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
  const [scope, animate] = useAnimate();
  const randomInt = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1) + min);
  const randomFloat = (min: number, max: number): number =>
    Math.random() * (max - min) + min;

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

  const handleClick = useCallback(() => {
    if (isPending) return;
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount((prev) => Math.max(0, prev + (newIsLiked ? 1 : -1)));

    toggleLike({ workBookId });
  }, [isPending, isLiked, likeCount, toggleLike, workBookId]);

  useEffect(() => {
    if (!isLiked) {
      return;
    }
    const indices = Array.from({ length: iconCount }, (_, i) => i);

    const reset = indices.map((index) => [
      `.icon-${index}`,
      { x: 0, y: 0, opacity: 0, scale: 0 },
      { duration: 0 },
    ]);

    const burst = indices.map((index) => [
      `.icon-${index}`,
      {
        x: randomInt(-100, 100),
        y: randomInt(-100, 100),
        opacity: [0, 1, 0],
        scale: [0, randomFloat(1, 1.5), 0],
      },
      {
        duration: 0.7,
        at: 0,
      },
    ]);

    animate([...reset, ...burst] as AnimationSequence);
  }, [animate, iconCount, isLiked]);

  return (
    <div className="flex items-center flex-col gap-1" ref={scope}>
      <Button
        variant="outline"
        className={cn("relative", className)}
        size={"icon"}
        onClick={handleClick}
        aria-pressed={isLiked}
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
        <span aria-hidden className="pointer-events-none absolute inset-0">
          {Array.from({ length: iconCount }).map((_, index) => (
            <HeartIcon
              key={index}
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-destructive fill-destructive opacity-0 icon-${index}`}
            />
          ))}
        </span>
      </Button>
      <span className="tabular-nums text-2xs text-muted-foreground">
        {likeCount}
      </span>
    </div>
  );
}
