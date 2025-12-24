"use client";

import {
  ReportCategoryDetail,
  ReportCategoryMain,
} from "@service/report/types";
import {
  BLOCK_SELECTABLE_REASONS,
  REPORT_REASON_SECTIONS,
  type ReportBlock,
  type ReportDraft,
} from "@service/solves/shared";
import { Flag, Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// 목업(화면)용 블록 데이터 나중에 제거
const DEMO_BLOCKS: ReportBlock[] = [
  {
    id: "block-1",
    order: 1,
    question:
      "다음 중 JavaScript에서 변수를 선언할 때 사용하는 키워드로 올바르지 않은 것은?",
  },
  {
    id: "block-2",
    order: 2,
    question:
      "React에서 컴포넌트의 상태를 관리하기 위해 사용하는 훅(Hook)은 무엇인가요?",
  },
  {
    id: "block-3",
    order: 3,
    question:
      "CSS Flexbox에서 주축(main axis)의 방향을 세로로 변경하려면 어떤 속성을 사용해야 하나요?",
  },
  {
    id: "block-4",
    order: 4,
    question:
      "TypeScript에서 인터페이스(interface)와 타입(type)의 차이점을 설명하시오.",
  },
  {
    id: "block-5",
    order: 5,
    question: "HTTP 상태 코드 404는 어떤 상황을 나타내는가?",
  },
];

interface BlockItemProps {
  block: ReportBlock;
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function BlockItem({ block, isChecked, onCheckedChange }: BlockItemProps) {
  const truncatedQuestion =
    block.question.length > 25
      ? `${block.question.slice(0, 25)}...`
      : block.question;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
            "hover:bg-accent/50 hover:border-primary/30",
            isChecked
              ? "bg-primary/5 border-primary/40"
              : "bg-background border-border"
          )}
          onClick={() => onCheckedChange(!isChecked)}
        >
          <Checkbox
            checked={isChecked}
            onCheckedChange={(checked) => onCheckedChange(checked === true)}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-primary/80 mr-2">
              {block.order}번 문제
            </span>
            <span className="text-sm text-muted-foreground truncate">
              {truncatedQuestion}
            </span>
          </div>
          <Info className="w-4 h-4 text-muted-foreground/50 shrink-0" />
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-sm p-3 bg-popover border shadow-lg"
      >
        <div className="space-y-1">
          <p className="font-medium text-sm text-primary">
            {block.order}번 문제
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {block.question}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface WorkbookReportDialogProps {
  blocks?: ReportBlock[];
  children?: React.ReactNode;
  /** 외부에서 open 상태 제어 */
  open?: boolean;
  /** 외부에서 open 상태 변경 핸들러 */
  onOpenChange?: (open: boolean) => void;
  /** 문제집 ID */
  workbookId?: string;
  onSubmit?: (drafts: ReportDraft[]) => void | Promise<void>;
}

export const WorkbookReportDialog = ({
  blocks = DEMO_BLOCKS,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  workbookId,
  onSubmit,
}: WorkbookReportDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  // 제어/비제어 컴포넌트 패턴
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? controlledOnOpenChange ?? (() => {})
    : setInternalOpen;

  const [selectedReason, setSelectedReason] = useState<ReportCategoryDetail>();
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set()); // 미정 어떤 값 보낼지
  const [description, setDescription] = useState("");

  const selectedCategoryMain = useMemo(() => {
    if (!selectedReason) return undefined;
    for (const section of REPORT_REASON_SECTIONS) {
      if (section.reasons.some((r) => r.detail === selectedReason)) {
        return section.main;
      }
    }
    return ReportCategoryMain.OTHER;
  }, [selectedReason]);

  const showBlockSelector = Boolean(
    selectedReason &&
      blocks.length &&
      BLOCK_SELECTABLE_REASONS.has(selectedReason)
  );

  const canSubmit = Boolean(
    selectedReason && selectedCategoryMain && description.trim().length > 0
  );

  useEffect(() => {
    if (!open) {
      // 다이얼로그가 닫히면 모든 상태 초기화
      setSelectedReason(undefined);
      setSelectedBlocks(new Set());
      setDescription("");
    }
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* 제어 컴포넌트가 아닐 때만 트리거 표시 */}
      {!isControlled && (
        <DialogTrigger asChild>
          {children ?? (
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Flag className="w-4 h-4" />
              신고하기
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent
        className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            신고 사유를 선택해주세요
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            운영자 검토 후 신고 내용이 반영돼요
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2 space-y-4">
          <RadioGroup
            value={selectedReason}
            onValueChange={(value) => {
              setSelectedReason(value as ReportCategoryDetail);
              setSelectedBlocks(new Set());
            }}
            className="space-y-2"
          >
            {REPORT_REASON_SECTIONS.map((section) => (
              <div key={section.main} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide py-1">
                  {section.heading}
                </div>
                {section.reasons.map((reason) => (
                  <label
                    key={reason.detail}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      "hover:bg-accent/50",
                      selectedReason === reason.detail
                        ? "bg-primary/5 border-primary/40"
                        : "border-border"
                    )}
                  >
                    <RadioGroupItem
                      value={reason.detail}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-sm">{reason.label}</span>
                  </label>
                ))}
              </div>
            ))}
          </RadioGroup>

          {/* 블록 선택 영역 - 오류 관련 사유 선택 시 표시 */}
          {showBlockSelector && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm font-medium">
                  해당하는 문제를 선택해주세요
                </span>
                <span className="text-xs text-muted-foreground">
                  (복수 선택 가능)
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {blocks?.map((block) => (
                  <BlockItem
                    key={block.id}
                    block={block}
                    isChecked={selectedBlocks.has(block.id)}
                    onCheckedChange={(checked) =>
                      setSelectedBlocks((prev) => {
                        const next = new Set(prev);
                        if (checked) {
                          next.add(block.id);
                        } else {
                          next.delete(block.id);
                        }
                        return next;
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* 상세 설명 입력 */}
          <div className="space-y-2 pt-2 border-t">
            <label className="text-sm text-muted-foreground">
              자세한 내용을 적어주세요 (빠른 피드백을 드릴 수 있어요)
            </label>
            <Textarea
              placeholder="예) 3번문제 보기에 오류가 있어요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button
            disabled={!canSubmit}
            onClick={() => {
              console.log(selectedReason);
              console.log(selectedBlocks); // 체크 된 값
              if (!canSubmit) return;
            }}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            신고하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
