"use client";

import type { OxBlockAnswer, OxBlockContent } from "@service/solves/shared";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OxCardContentProps {
  content: OxBlockContent;
  answer?: OxBlockAnswer;
}

export function OxCardContent({ content, answer }: OxCardContentProps) {
  const correctAnswer = answer?.answer;

  const renderOption = (
    option: OxBlockContent["oOption"],
    label: "O" | "X",
  ) => {
    const isCorrect = correctAnswer === label.toLowerCase();

    return (
      <div
        className={cn(
          "relative flex flex-1 items-center justify-center rounded-lg border-2 p-8 transition-all",
          isCorrect
            ? "border-green-500 bg-green-50 dark:bg-green-950/30"
            : "border-border bg-muted/30",
        )}
      >
        {isCorrect && (
          <div className="absolute right-2 top-2">
            <Check className="h-6 w-6 text-green-600 dark:text-green-500" />
          </div>
        )}
        {option.type === "text" ? (
          <div className="text-center">
            <div
              className={cn(
                "mb-2 text-4xl font-bold",
                isCorrect
                  ? "text-green-700 dark:text-green-400"
                  : "text-foreground",
              )}
            >
              {label}
            </div>
            {option.text && option.text !== label && (
              <p
                className={cn(
                  "text-sm",
                  isCorrect
                    ? "text-green-600 dark:text-green-500"
                    : "text-muted-foreground",
                )}
              >
                {option.text}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div
              className={cn(
                "mb-2 text-4xl font-bold",
                isCorrect
                  ? "text-green-700 dark:text-green-400"
                  : "text-foreground",
              )}
            >
              {label}
            </div>
            {option.url.startsWith("http") ? (
              <img
                src={option.url}
                alt={label}
                className="mx-auto h-24 w-24 rounded object-cover"
              />
            ) : (
              <p className="text-xs text-muted-foreground">{option.url}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-3 flex gap-4">
      {renderOption(content.oOption, "O")}
      {renderOption(content.xOption, "X")}
    </div>
  );
}
