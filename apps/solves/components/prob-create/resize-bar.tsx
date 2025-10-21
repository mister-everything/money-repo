"use client";

interface ResizeBarProps {
  onMouseDown: (e: React.MouseEvent) => void;
}

export function ResizeBar({ onMouseDown }: ResizeBarProps) {
  return (
    <div
      className="w-1 bg-white/20 hover:bg-white/40 cursor-col-resize flex-shrink-0"
      onMouseDown={onMouseDown}
    />
  );
}
