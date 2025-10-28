"use client";

import type { DefaultBlockAnswer } from "@service/solves/shared";
import { Badge } from "@/components/ui/badge";

interface DefaultCardContentProps {
  question?: string;
  answer?: DefaultBlockAnswer;
}

export function DefaultCardContent({
  question,
  answer,
}: DefaultCardContentProps) {
  const correctAnswers = answer?.answer || [];

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-md border border-dashed border-border bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">주관식 답변 입력란</p>
      </div>
      {correctAnswers.length > 0 && (
        <div className="rounded-md border border-green-500 bg-green-50 p-4 dark:bg-green-950/30">
          <div className="mb-2 flex items-center gap-2">
            <Badge className="bg-green-600 hover:bg-green-700 dark:bg-green-700">
              정답
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {correctAnswers.map((ans, idx) => (
              <span
                key={idx}
                className="rounded-md bg-green-100 px-3 py-1 text-sm font-medium text-green-900 dark:bg-green-900/30 dark:text-green-100"
              >
                {ans}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
