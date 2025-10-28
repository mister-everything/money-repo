"use client";

import type { McqBlockAnswer, McqBlockContent } from "@service/solves/shared";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface McqCardContentProps {
  content: McqBlockContent;
  answer?: McqBlockAnswer;
}

export function McqCardContent({ content, answer }: McqCardContentProps) {
  const correctAnswers = answer?.answer || [];

  return (
    <div className="mt-3 space-y-2">
      <div className="text-sm text-muted-foreground">선택지</div>
      <div className="space-y-2">
        {content.options.map((option, idx) => {
          const isCorrect = correctAnswers.includes(option.id);
          return (
            <div
              key={option.id}
              className={cn(
                "flex items-start gap-2 rounded-md border p-3 transition-colors",
                isCorrect
                  ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                  : "border-border bg-muted/30",
              )}
            >
              <Badge
                variant={isCorrect ? "default" : "outline"}
                className={cn(
                  "shrink-0",
                  isCorrect &&
                    "bg-green-600 hover:bg-green-700 dark:bg-green-700",
                )}
              >
                {idx + 1}
              </Badge>
              <div className="flex-1">
                {option.type === "text" ? (
                  <p
                    className={cn(
                      "text-sm",
                      isCorrect
                        ? "font-medium text-green-900 dark:text-green-100"
                        : "text-foreground",
                    )}
                  >
                    {option.text}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {option.mimeType}
                    </p>
                    {option.url.startsWith("http") ? (
                      <img
                        src={option.url}
                        alt={`선택지 ${idx + 1}`}
                        className="h-20 w-20 rounded object-cover"
                      />
                    ) : (
                      <p className="text-sm text-foreground">{option.url}</p>
                    )}
                  </div>
                )}
              </div>
              {isCorrect && (
                <Check className="h-5 w-5 shrink-0 text-green-600 dark:text-green-500" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
