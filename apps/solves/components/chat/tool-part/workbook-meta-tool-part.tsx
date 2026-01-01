import { UseChatHelpers } from "@ai-sdk/react";
import {
  WORKBOOK_DESCRIPTION_MAX_LENGTH,
  WORKBOOK_TITLE_MAX_LENGTH,
} from "@service/solves/shared";
import { getToolName, ToolUIPart, UIMessage } from "ai";
import { CheckIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { GradualSpacingText } from "@/components/ui/gradual-spacing-text";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { DeepPartial } from "@/global";
import { ToolCanceledMessage } from "@/lib/ai/shared";
import { WorkbookMetaInput } from "@/lib/ai/tools/workbook/shared";
import { cn } from "@/lib/utils";
import { useWorkbookEditStore } from "@/store/workbook-edit-store";

type OkOutput = {
  title?: string;
  description?: string;
};

export function WorkbookMetaToolPart({
  part,
  addToolOutput,
}: {
  part: ToolUIPart;
  addToolOutput?: UseChatHelpers<UIMessage>["addToolOutput"];
}) {
  const input = part.input as DeepPartial<WorkbookMetaInput> | undefined;

  const isStreaming = useMemo(
    () => part.state == "input-streaming",
    [part.state],
  );

  const isPending = useMemo(
    () => part.state == "input-available",
    [part.state],
  );

  const output = part.output as string | undefined | OkOutput;
  const outputStatus = useMemo(() => {
    if (isPending) return "pending";
    if (output == ToolCanceledMessage) return "rejected";
    return "approved";
  }, [output]);

  const titles = useMemo(
    () => input?.titles?.filter?.(Boolean) ?? [],
    [input?.titles],
  );
  const descriptions = useMemo(
    () => input?.descriptions?.filter?.(Boolean) ?? [],
    [input?.descriptions],
  );

  const [selectedTitleIndex, setSelectedTitleIndex] = useState(
    (output as OkOutput)?.title ?? "",
  );
  const [selectedDescriptionIndex, setSelectedDescriptionIndex] = useState(
    (output as OkOutput)?.description ?? "",
  );

  useEffect(() => {
    if (part.state == "output-available") return;
    setSelectedTitleIndex("");
    setSelectedDescriptionIndex("");
  }, [titles.length, descriptions.length, part.state]);

  const handleApply = useCallback(
    (isApproved: boolean) => {
      if (isApproved) {
        const selectedTitle = titles[Number(selectedTitleIndex)] ?? "";
        const selectedDescription =
          descriptions[Number(selectedDescriptionIndex)] ?? "";
        const store = useWorkbookEditStore.getState();
        store.setWorkBook((prev) => ({
          ...prev,
          title: selectedTitle.trim().slice(0, WORKBOOK_TITLE_MAX_LENGTH),
          description: selectedDescription
            .trim()
            .slice(0, WORKBOOK_DESCRIPTION_MAX_LENGTH),
        }));
        store.triggerScrollToTop();
      }
      addToolOutput?.({
        state: "output-available",
        tool: getToolName(part),
        toolCallId: part.toolCallId,
        output: isApproved
          ? {
              title: selectedTitleIndex,
              description: selectedDescriptionIndex,
            }
          : ToolCanceledMessage,
      });
    },
    [
      titles,
      descriptions,
      selectedTitleIndex,
      selectedDescriptionIndex,
      addToolOutput,
      part,
    ],
  );

  return (
    <div className="flex flex-col text-sm group select-none text-muted-foreground">
      {part.errorText ? (
        <p className="fade-300">제목·설명 생성을 실패하였습니다.</p>
      ) : (
        <>
          {isStreaming ? (
            <TextShimmer>{`제목·설명 생성중...`}</TextShimmer>
          ) : (
            <p>
              <GradualSpacingText
                key={part.state}
                text={
                  isPending
                    ? "마음에 드는 제목과 설명을 선택해주세요."
                    : outputStatus == "approved"
                      ? "제목·설명 적용되었어요."
                      : outputStatus == "rejected"
                        ? "제목·설명 거절되었어요."
                        : "제목·설명 생성함"
                }
              />
            </p>
          )}
        </>
      )}
      {part.state != "output-error" && (
        <div
          className={cn(
            "p-4 mt-3",
            isStreaming && "border-muted text-muted-foreground animate-pulse",
          )}
        >
          <div className="space-y-4">
            {/* 제목 선택 */}
            {titles.length > 0 && (
              <div className="space-y-2">
                <p
                  className={cn(
                    "text-muted-foreground",
                    isPending && "animate-pulse",
                  )}
                >
                  <GradualSpacingText
                    text={`문제집 제목 ${titles.length}개 추천`}
                  />
                </p>
                <RadioGroup
                  value={selectedTitleIndex}
                  onValueChange={setSelectedTitleIndex}
                  disabled={!isPending}
                  className="gap-2"
                >
                  {titles.map((title, index) => {
                    const key = `title-${index}`;
                    return (
                      <Label
                        key={key}
                        onClick={() =>
                          isPending && setSelectedTitleIndex(String(index))
                        }
                        className={cn(
                          "flex items-center gap-2 border rounded-lg p-4 bg-background cursor-pointer transition-colors",
                          selectedTitleIndex === String(index) &&
                            "border-primary bg-primary/5",
                          outputStatus == "rejected" && "bg-muted!",
                        )}
                      >
                        <RadioGroupItem value={String(index)} />
                        <span className="text-foreground cursor-pointer flex-1">
                          {title}
                        </span>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </div>
            )}

            {/* 설명 선택 */}
            {descriptions.length > 0 && (
              <div className="space-y-2">
                <p
                  className={cn(
                    "text-muted-foreground",
                    isPending && "animate-pulse",
                  )}
                >
                  <GradualSpacingText
                    text={`문제집 설명 ${descriptions.length}개 추천`}
                  />
                </p>
                <RadioGroup
                  value={selectedDescriptionIndex}
                  onValueChange={setSelectedDescriptionIndex}
                  className="gap-2"
                  disabled={!isPending}
                >
                  {descriptions.map((desc, index) => {
                    const key = `desc-${index}`;

                    return (
                      <Label
                        key={key}
                        onClick={() =>
                          isPending &&
                          setSelectedDescriptionIndex(String(index))
                        }
                        className={cn(
                          "flex items-center gap-2 border rounded-lg p-4 bg-background cursor-pointer transition-colors",
                          selectedDescriptionIndex === String(index) &&
                            "border-primary bg-primary/5",
                          outputStatus == "rejected" && "bg-muted!",
                        )}
                      >
                        <RadioGroupItem value={String(index)} />
                        <span className="text-foreground cursor-pointer flex-1">
                          {desc}
                        </span>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </div>
            )}

            {isPending ? (
              <div className="fade-1000 flex justify-end items-center gap-2 mt-2">
                <Button
                  variant="default"
                  disabled={!selectedTitleIndex && !selectedDescriptionIndex}
                  onClick={() => handleApply(true)}
                >
                  <CheckIcon className="size-3 stroke-3" />
                  적용
                </Button>
              </div>
            ) : (
              <div className="h-2" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
