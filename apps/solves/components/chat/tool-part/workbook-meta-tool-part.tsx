import { UseChatHelpers } from "@ai-sdk/react";

import { getToolName, ToolUIPart, UIMessage } from "ai";
import { CheckIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

import { TextShimmer } from "@/components/ui/text-shimmer";

import { DeepPartial } from "@/global";
import { WorkbookMetaInput } from "@/lib/ai/tools/workbook/shared";
import { cn } from "@/lib/utils";
import { useWorkbookEditStore } from "@/store/workbook-edit-store";

enum ToolOutput {
  approved = "approved",
  rejected = "rejected",
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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setTitle(input?.title ?? "");
    setDescription(input?.description ?? "");
  }, [input?.title, input?.description]);

  const handleApply = useCallback(
    (isApproved: boolean) => {
      if (isApproved) {
        useWorkbookEditStore.getState().setWorkBook((prev) => ({
          ...prev,
          title: title.trim(),
          description: description.trim(),
        }));
      }
      addToolOutput?.({
        state: "output-available",
        tool: getToolName(part),
        toolCallId: part.toolCallId,
        output: isApproved ? ToolOutput.approved : ToolOutput.rejected,
      });
    },
    [title, description],
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
            <p className="fade-300">
              {isPending
                ? "이런 제목·설명은 어떨까요?"
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
          <div
            className={cn(
              "space-y-2 border rounded-lg p-3 bg-background",
              isPending && "animate-pulse",
              output == ToolOutput.rejected && "bg-muted",
            )}
          >
            <p className="text-foreground border-none font-semibold">{title}</p>
            <p className="text-muted-foreground text-xs">{description}</p>
          </div>

          {isPending && (
            <div className="flex justify-end items-center gap-2 mt-2">
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
                className=" text-xs"
                onClick={() => handleApply(true)}
              >
                <CheckIcon className="size-3 stroke-3" />
                적용
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
