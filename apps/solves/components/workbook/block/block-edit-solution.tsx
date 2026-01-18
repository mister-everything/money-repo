"use client";

export function BlockEditSolution({
  solution,
}: {
  solution: string;
}) {
  return (
    <div className="px-2 pb-2 flex flex-col gap-4 text-muted-foreground text-xs">
      <div className="flex gap-2">
        <span className="w-16 text-muted-foreground/50 font-semibold">
          해설
        </span>
        <p className="text-muted-foreground whitespace-pre-wrap">
          {solution.trim() || "해설이 없습니다."}
        </p>
      </div>
    </div>
  );
}
