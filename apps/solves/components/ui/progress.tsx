"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  indicatorColor?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorColor, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        className,
      )}
      {...props}
    >
      <div
        className="h-full flex-1 transition-all rounded-full"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: indicatorColor || "hsl(var(--primary))",
        }}
      />
    </div>
  ),
);
Progress.displayName = "Progress";

export { Progress };
