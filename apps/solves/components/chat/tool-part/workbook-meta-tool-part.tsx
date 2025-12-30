import { UseChatHelpers } from "@ai-sdk/react";
import {
  WORKBOOK_DESCRIPTION_MAX_LENGTH,
  WORKBOOK_TITLE_MAX_LENGTH,
} from "@service/solves/shared";
import { getToolName, ToolUIPart, UIMessage } from "ai";
import { CheckIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { DeepPartial } from "@/global";
import { WorkbookMetaInput } from "@/lib/ai/tools/workbook/shared";
import { cn } from "@/lib/utils";
import { useWorkbookEditStore } from "@/store/workbook-edit-store";

enum ToolOutput {
  approved = "사용자가 제목·설명을 적용했습니다.",
  rejected = "사용자가 제목·설명을 반영하지 않았습니다. 이유를 물어보세요.",
}

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

  const output = part.output as ToolOutput | undefined;

  const titles = useMemo(
    () => input?.titles?.filter(Boolean) ?? [],
    [input?.titles],
  );
  const descriptions = useMemo(
    () => input?.descriptions?.filter(Boolean) ?? [],
    [input?.descriptions],
  );

  const [selectedTitleIndex, setSelectedTitleIndex] = useState("0");
  const [selectedDescriptionIndex, setSelectedDescriptionIndex] = useState("0");

  useEffect(() => {
    setSelectedTitleIndex("0");
    setSelectedDescriptionIndex("0");
  }, [titles.length, descriptions.length]);

  const handleApply = useCallback(
    (isApproved: boolean) => {
      if (isApproved) {
        const selectedTitle = titles[Number(selectedTitleIndex)] ?? "";
        const selectedDescription =
          descriptions[Number(selectedDescriptionIndex)] ?? "";
        useWorkbookEditStore.getState().setWorkBook((prev) => ({
          ...prev,
          title: selectedTitle.trim().slice(0, WORKBOOK_TITLE_MAX_LENGTH),
          description: selectedDescription
            .trim()
            .slice(0, WORKBOOK_DESCRIPTION_MAX_LENGTH),
        }));
      }
      addToolOutput?.({
        state: "output-available",
        tool: getToolName(part),
        toolCallId: part.toolCallId,
        output: isApproved ? ToolOutput.approved : ToolOutput.rejected,
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
            <p className="fade-300" key={part.state}>
              {isPending
                ? "마음에 드는 제목과 설명을 선택해주세요."
                : output == ToolOutput.approved
                  ? "제목·설명 적용되었어요."
                  : output == ToolOutput.rejected
                    ? "제목·설명 거절되었어요."
                    : "제목·설명 생성함"}
            </p>
          )}
        </>
      )}
      {part.state != "output-error" && (
        <div
          className={cn(
            "px-2 mt-3 fade-1000",
            isStreaming && "border-muted text-muted-foreground animate-pulse",
          )}
        >
          <div className="space-y-4">
            {/* 제목 선택 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">제목</p>
              <RadioGroup
                value={selectedTitleIndex}
                onValueChange={setSelectedTitleIndex}
                disabled={!isPending}
                className="gap-2"
              >
                {titles.map((title, index) => (
                  <Label
                    htmlFor={`title-${index}`}
                    key={index}
                    className={cn(
                      "flex items-center gap-2 border rounded-lg p-4 bg-background cursor-pointer transition-colors",
                      selectedTitleIndex === String(index) &&
                        "border-primary bg-primary/5",
                      output == ToolOutput.rejected && "bg-muted!",
                    )}
                  >
                    <RadioGroupItem
                      value={String(index)}
                      id={`title-${index}`}
                    />
                    <span className="text-foreground cursor-pointer flex-1">
                      {title}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* 설명 선택 */}
            <div className="space-y-2">
              <p className="text-xs text-mu">설명</p>
              <RadioGroup
                value={selectedDescriptionIndex}
                onValueChange={setSelectedDescriptionIndex}
                className="gap-2"
                disabled={!isPending}
              >
                {descriptions.map((desc, index) => (
                  <Label
                    htmlFor={`desc-${index}`}
                    key={index}
                    className={cn(
                      "flex items-center gap-2 border rounded-lg p-4 bg-background cursor-pointer transition-colors",
                      selectedDescriptionIndex === String(index) &&
                        "border-primary bg-primary/5",
                      output == ToolOutput.rejected && "bg-muted!",
                    )}
                  >
                    <RadioGroupItem
                      value={String(index)}
                      id={`desc-${index}`}
                    />
                    <span className="text-foreground cursor-pointer flex-1">
                      {desc}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {isPending ? (
              <div className="fade-1000 flex justify-end items-center gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleApply(false)}
                >
                  <XIcon className="size-3 stroke-3" />
                  취소
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="text-xs"
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
