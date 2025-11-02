"use client";

import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
}

export function ResizeHandle({ onMouseDown, className }: ResizeHandleProps) {
  return (
    <div
      className={cn(
        "group relative flex w-1 cursor-col-resize items-center justify-center bg-border transition-colors hover:bg-primary/20",
        className,
      )}
      onMouseDown={onMouseDown}
    >
      <div className="absolute inset-y-0 -left-1 -right-1" />
      <div className="flex h-16 items-center justify-center rounded-md bg-background opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}
