"use client";

import { AnimationSequence, useAnimate } from "framer-motion";
import { CheckIcon, SparkleIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface BlockEditCheckButtonProps {
  feedback?: string;
  onClick?: () => void;
  iconCount?: number;
}

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1) + min);
const randomFloat = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

export function BlockEditCheckButton({
  feedback,
  onClick,
  iconCount = 10,
}: BlockEditCheckButtonProps) {
  const isValid = useMemo(() => !feedback, [feedback]);
  const [scope, animate] = useAnimate();
  useEffect(() => {
    if (isValid) return;
    return () => {
      if (!scope.current) return;
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
    };
  }, [isValid]);

  return (
    <div ref={scope}>
      <Tooltip open={feedback ? undefined : false}>
        <TooltipTrigger asChild>
          <div>
            <Button
              onClick={onClick}
              variant="ghost"
              size="icon"
              className={cn(
                "hover:bg-primary hover:text-primary-foreground relative",
                isValid && "text-primary-foreground bg-primary",
              )}
              disabled={!isValid}
            >
              <CheckIcon />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
              >
                {Array.from({ length: iconCount }).map((_, index) => (
                  <SparkleIcon
                    key={index}
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-primary text-primary opacity-0 icon-${index}`}
                  />
                ))}
              </span>
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent className="whitespace-pre-wrap">
          {feedback}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
