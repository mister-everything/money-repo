import {
  WORKBOOK_DESCRIPTION_MAX_LENGTH,
  WORKBOOK_TITLE_MAX_LENGTH,
} from "@service/solves/shared";
import { ToolUIPart } from "ai";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  GenerateWorkbookMetaInput,
  WORKBOOK_META_TOOL_NAMES,
} from "@/lib/ai/tools/workbook/shared";
import { cn } from "@/lib/utils";
import { useWorkbookEditStore } from "@/store/workbook-edit-store";

type MetaCandidate = {
  title: string;
  description: string;
  maxTitle: number;
  maxDescription: number;
};

export function WorkbookMetaToolPart({
  part,
}: {
  part: ToolUIPart;
  type: WORKBOOK_META_TOOL_NAMES;
}) {
  const workBook = useWorkbookEditStore((state) => state.workBook);
  const setWorkBook = useWorkbookEditStore((state) => state.setWorkBook);

  const isPending = useMemo(
    () => part.state.startsWith("input-"),
    [part.state],
  );

  const candidate = useMemo<MetaCandidate>(() => {
    const input = part.input as Partial<GenerateWorkbookMetaInput> | undefined;
    const output = part.output as
      | { title?: string; description?: string; note?: string }
      | undefined;
    return {
      title: output?.title ?? input?.title ?? "",
      description: output?.description ?? input?.description ?? "",
      maxTitle: WORKBOOK_TITLE_MAX_LENGTH,
      maxDescription: WORKBOOK_DESCRIPTION_MAX_LENGTH,
    };
  }, [part.input, part.output]);

  const [title, setTitle] = useState(candidate.title);
  const [description, setDescription] = useState(candidate.description);

  useEffect(() => {
    setTitle(candidate.title);
    setDescription(candidate.description);
  }, [candidate.title, candidate.description]);

  const isApplied = useMemo(() => {
    if (!workBook) return false;
    return (
      workBook.title === title && (workBook.description ?? "") === description
    );
  }, [title, description, workBook]);

  const handleApply = () => {
    if (!workBook) {
      toast.error("문제집 정보를 불러오지 못했어요.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      toast.error("제목과 설명을 모두 입력하세요.");
      return;
    }
    setWorkBook((prev) => {
      if (!prev) return prev;
      return { ...prev, title, description };
    });
    toast.success("문제집 정보에 적용했어요.");
  };

  return (
    <div className="p-4">
      <div
        className={cn(
          "rounded-lg border bg-background p-4 space-y-3 fade-300",
          isPending && "border-muted text-muted-foreground animate-pulse",
        )}
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            문제집 제목 · 설명 제안
          </Badge>
        </div>

        <div className="space-y-2">
          <Input
            value={title}
            maxLength={candidate.maxTitle}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isPending || !workBook}
            placeholder="제목 (최대 20자)"
          />
          <Textarea
            value={description}
            maxLength={candidate.maxDescription}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending || !workBook}
            placeholder="한줄 설명 (최대 25자)"
            className="resize-none"
            rows={2}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={
              isPending ||
              !title.trim() ||
              !description.trim() ||
              !workBook ||
              isApplied
            }
            onClick={handleApply}
          >
            {isApplied ? "적용됨" : "제목·설명 적용"}
          </Button>
        </div>
      </div>
    </div>
  );
}
