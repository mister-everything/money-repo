"use client";

import {
  REPORT_REASON_SECTIONS,
  ReportCategoryDetail,
  ReportCategoryMain,
  ReportTargetType,
} from "@service/report/shared";
import { Flag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createReportAction } from "@/actions/report";
import { Button } from "@/components/ui/button";
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
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";

interface WorkbookReportDialogProps {
  children?: React.ReactNode;
  /** 외부에서 open 상태 제어 */
  open?: boolean;
  /** 외부에서 open 상태 변경 핸들러 */
  onOpenChange?: (open: boolean) => void;
  /** 문제집 ID */
  workbookId?: string;
}

export const WorkbookReportDialog = ({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  workbookId,
}: WorkbookReportDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  // 제어/비제어 컴포넌트 패턴
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? controlledOnOpenChange ?? (() => {})
    : setInternalOpen;

  const [selectedReason, setSelectedReason] = useState<ReportCategoryDetail>();
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

  const canSubmit = Boolean(
    selectedReason && selectedCategoryMain && description.trim().length > 0
  );

  useEffect(() => {
    if (!open) {
      // 다이얼로그가 닫히면 모든 상태 초기화
      setSelectedReason(undefined);
      setDescription("");
    }
  }, [open]);

  // createWorkbookAction 참고함
  const [_, createReport, isPending] = useSafeAction(createReportAction, {
    successMessage: "신고가 접수되었습니다. 감사합니다.",
    failMessage: "신고 접수에 실패했습니다. 잠시 후 다시 시도해주세요.",
    onSuccess: () => {
      setOpen(false);
    },
  });

  const handleSubmit = () => {
    if (!canSubmit || !selectedCategoryMain || !selectedReason || !workbookId)
      return;

    createReport({
      targetType: ReportTargetType.WORKBOOK, // 에러 타입
      targetId: workbookId, // 문제집 ID
      categoryMain: selectedCategoryMain, // 대분류 에러
      categoryDetail: selectedReason, // 세부 에러
      detailText: description, // 상세 설명
    });
  };

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
            disabled={!canSubmit || isPending}
            onClick={handleSubmit}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            신고하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
