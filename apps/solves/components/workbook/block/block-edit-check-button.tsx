"use client";

import { CheckIcon, SparkleIcon } from "lucide-react";
import { useMemo } from "react";
import { AnimatedToggleButton } from "@/components/ui/animated-toggle-button";
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

export function BlockEditCheckButton({
  feedback,
  onClick,
  iconCount = 10,
}: BlockEditCheckButtonProps) {
  const isValid = useMemo(() => !feedback, [feedback]);

  return (
    <Tooltip open={feedback ? undefined : false}>
      <TooltipTrigger asChild>
        <div>
          <AnimatedToggleButton
            burstIcon={SparkleIcon}
            iconCount={iconCount}
            active={isValid}
            onClick={onClick}
            variant="ghost"
            size="icon"
            className={cn(
              "hover:bg-primary hover:text-primary-foreground",
              isValid && "bg-primary text-primary-foreground",
            )}
            burstIconClassName="fill-primary text-primary"
            disabled={!isValid}
          >
            <CheckIcon />
          </AnimatedToggleButton>
        </div>
      </TooltipTrigger>
      <TooltipContent className="whitespace-pre-wrap">
        {feedback}
      </TooltipContent>
    </Tooltip>
  );
}
