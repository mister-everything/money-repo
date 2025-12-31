import { UIMessage, UseChatHelpers } from "@ai-sdk/react";
import { getToolName, ToolUIPart } from "ai";
import { useCallback, useEffect, useMemo, useState } from "react";
import z from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { askBackInputSchema } from "@/lib/ai/tools/workbook/ask-back-tools";
import { cn } from "@/lib/utils";

type AskBackInput = z.infer<typeof askBackInputSchema>;
type AskBackQuestion = AskBackInput["questions"][number];
type AskBackOutput = Array<{
  index: number;
  question: AskBackQuestion["question"];
  selectedOptions: Array<AskBackQuestion["options"][number]>;
}>;

export function AskBackToolPart({
  part,
  addToolOutput,
}: {
  part: ToolUIPart;
  addToolOutput?: UseChatHelpers<UIMessage>["addToolOutput"];
}) {
  const input = part.input as AskBackInput | undefined;
  const questions = input?.questions ?? [];
  const toolName = useMemo(() => getToolName(part), [part]);

  const buildInitialSelections = useCallback(
    (items: AskBackInput["questions"]) =>
      items.map((question, index) => ({
        index,
        question: question.question,
        selectedOptions: [],
      })),
    []
  );

  const [selected, setSelected] = useState<AskBackOutput>(() =>
    buildInitialSelections(questions)
  );
  const isReady = part.state === "input-available";
  const totalSelected = useMemo(
    () =>
      selected.reduce((count, item) => count + item.selectedOptions.length, 0),
    [selected]
  );

  const handleClick = useCallback(() => {
    addToolOutput?.({
      toolCallId: part.toolCallId,
      tool: toolName,
      state: "output-available",
      output: selected,
    });
  }, [addToolOutput, part.toolCallId, selected, toolName]);

  const handleToggle = useCallback(
    (questionIndex: number, option: string, checked: boolean) => {
      setSelected((prev) =>
        prev.map((item) => {
          if (item.index !== questionIndex) return item;
          const alreadySelected = item.selectedOptions.includes(option);
          const selectedOptions = checked
            ? alreadySelected
              ? item.selectedOptions
              : [...item.selectedOptions, option]
            : item.selectedOptions.filter((value) => value !== option);

          return {
            ...item,
            selectedOptions,
          };
        })
      );
    },
    []
  );

  useEffect(() => {
    if (!isReady) return;
    setSelected(buildInitialSelections(questions));
  }, [buildInitialSelections, isReady, questions]);

  return (
    <div className="space-y-4 rounded-2xl border bg-gradient-to-br from-background via-background to-muted/40 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">
            질문 방향 설정
          </div>
          <p className="text-xs text-muted-foreground">
            원하는 옵션을 선택하면 AI가 더 정확한 문제를 만들 수 있어요.
          </p>
        </div>
        <Badge variant="outline" className="rounded-full">
          {questions.length}개 질문
        </Badge>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-muted bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          표시할 질문이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, questionIndex) => {
            const selectedOptions =
              selected.find((item) => item.index === questionIndex)
                ?.selectedOptions ?? [];
            return (
              <Card key={questionIndex} className="border-muted/70 bg-card/80">
                <CardHeader className="gap-2 border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-full">
                      Q{questionIndex + 1}
                    </Badge>
                    <CardTitle className="text-sm">
                      {question.question}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {selectedOptions.length}개 선택됨
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const optionId = `ask-back-${part.toolCallId}-${questionIndex}-${optionIndex}`;
                    const isChecked = selectedOptions.includes(option);
                    return (
                      <label
                        key={optionId}
                        htmlFor={optionId}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition",
                          isChecked
                            ? "border-primary/60 bg-primary/5 text-primary"
                            : "border-muted bg-muted/40 text-foreground"
                        )}
                      >
                        <Checkbox
                          id={optionId}
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            handleToggle(
                              questionIndex,
                              option,
                              checked === true
                            )
                          }
                        />
                        <span className="flex-1">{option}</span>
                      </label>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          총 {totalSelected}개 선택됨
        </div>
        <Button disabled={!isReady} onClick={handleClick}>
          전송
        </Button>
      </div>
    </div>
  );
}
