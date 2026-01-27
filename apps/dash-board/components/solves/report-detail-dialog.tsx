"use client";

import {
  ReportCategoryDetail,
  ReportCategoryDetailLabel,
  ReportCategoryMain,
  ReportStatus,
  ReportStatusLabel,
} from "@service/report/shared";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { AlertTriangle, Flame, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  getReportDetail,
  updateReportStatus,
} from "@/app/(dash-board)/solves/reports/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { isSafeFail } from "@/lib/protocol/interface";
import { notify } from "../ui/notify";

type ReportDetail = {
  id: string;
  reportedAt: string;
  targetType: string;
  targetId: string;
  targetOwnerId: string | null;
  targetTitle: string | null;
  targetIsPublic: boolean | null;
  categoryMain: ReportCategoryMain;
  categoryDetail: ReportCategoryDetail;
  detailText: string | null;
  status: ReportStatus;
  processedAt: string | null;
  processingNote: string | null;
  reportCount: number;
  isPriority: boolean;
};

type Props = {
  reportId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReportDetailDialog({ reportId, open, onOpenChange }: Props) {
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus>(
    ReportStatus.RECEIVED,
  );
  const [processingNote, setProcessingNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const loadReport = async () => {
    if (!reportId) return;

    setLoading(true);
    try {
      const result = await getReportDetail({ reportId });

      if (isSafeFail(result)) {
        notify.alert({ title: `오류: ${result.message}` });
        return;
      }

      setReport(result.data as ReportDetail);
    } catch {
      notify.alert({ title: "오류: 신고 정보를 불러오는데 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!report) return;

    // RESOLVED/REJECTED 시 processingNote 필수
    if (
      (selectedStatus === ReportStatus.RESOLVED ||
        selectedStatus === ReportStatus.REJECTED) &&
      !processingNote.trim()
    ) {
      notify.alert({ title: "처리 메시지를 입력해주세요." });
      return;
    }

    // RESOLVED/REJECTED 확인 다이얼로그
    if (
      selectedStatus === ReportStatus.RESOLVED ||
      selectedStatus === ReportStatus.REJECTED
    ) {
      const confirmed = await notify.confirm({
        title: `정말 ${
          selectedStatus === ReportStatus.RESOLVED ? "처리 완료" : "반려"
        }하시겠습니까?\n저장 후에도 상태 변경은 가능합니다.`,
      });

      if (!confirmed) return;
    }

    startTransition(async () => {
      const result = await updateReportStatus({
        reportId: report.id,
        status: selectedStatus,
        processingNote: processingNote.trim() || undefined,
      });

      if (isSafeFail(result)) {
        notify.alert({ title: `오류: ${result.message}` });
        return;
      }

      notify.alert({ title: "신고 처리가 완료되었습니다." });
      onOpenChange(false);
      router.refresh();
    });
  };

  const showProcessingNote =
    selectedStatus === ReportStatus.RESOLVED ||
    selectedStatus === ReportStatus.REJECTED;

  useEffect(() => {
    if (open) {
      loadReport();
    } else {
      setReport(null);
      setProcessingNote("");
    }
  }, [open]);

  useEffect(() => {
    if (report) {
      setSelectedStatus(report.status);
      setProcessingNote(report.processingNote || "");
    }
  }, [report]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>신고 상세</DialogTitle>
          <DialogDescription>
            신고 내용을 검토하고 처리 상태를 변경할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : report ? (
          <div className="space-y-5">
            {/* 상단: 접수 정보 & 알림 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">접수 시각</p>
                  <p className="text-sm font-medium">
                    {format(new Date(report.reportedAt), "PPP HH:mm", {
                      locale: ko,
                    })}
                  </p>
                </div>
                <CategoryBadge
                  categoryMain={report.categoryMain}
                  categoryDetail={report.categoryDetail}
                  detailLabel={ReportCategoryDetailLabel}
                />
              </div>
              {report.isPriority && (
                <Badge className="bg-red-500 hover:bg-red-600 gap-1.5 px-3 py-1.5">
                  <Flame className="h-4 w-4" />
                  <span className="font-semibold">
                    우선검토 {report.reportCount}명
                  </span>
                </Badge>
              )}
            </div>

            {report.categoryDetail === ReportCategoryDetail.VIOL_COPYRIGHT && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  저작권 위반 - 즉시 비공개 조치 필요
                </p>
              </div>
            )}

            {/* 신고 정보 카드 */}
            <div className="grid grid-cols-[1fr,300px] gap-4">
              <div className="space-y-3">
                {/* 신고 내용 */}
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    신고 내용
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {report.detailText || "-"}
                  </p>
                </div>

                {/* 신고 문제집 */}
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    신고 문제집
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {report.targetTitle || "-"}
                    </p>
                    <Badge
                      variant={report.targetIsPublic ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {report.targetIsPublic ? "공개" : "비공개"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 처리 영역 */}
              <div className="space-y-3">
                <div className="p-4 border rounded-lg bg-background">
                  <Label className="text-sm font-semibold mb-3 block">
                    처리 상태
                  </Label>
                  <RadioGroup
                    value={selectedStatus}
                    onValueChange={(value) =>
                      setSelectedStatus(value as ReportStatus)
                    }
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={ReportStatus.RECEIVED}
                        id="received"
                      />
                      <Label
                        htmlFor="received"
                        className="cursor-pointer font-normal"
                      >
                        {ReportCategoryDetailLabel[ReportStatus.RECEIVED]}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={ReportStatus.IN_REVIEW}
                        id="in_review"
                      />
                      <Label
                        htmlFor="in_review"
                        className="cursor-pointer font-normal"
                      >
                        {ReportCategoryDetailLabel[ReportStatus.IN_REVIEW]}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={ReportStatus.RESOLVED}
                        id="resolved"
                      />
                      <Label
                        htmlFor="resolved"
                        className="cursor-pointer font-normal"
                      >
                        {ReportStatusLabel[ReportStatus.RESOLVED]}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={ReportStatus.REJECTED}
                        id="rejected"
                      />
                      <Label
                        htmlFor="rejected"
                        className="cursor-pointer font-normal"
                      >
                        {ReportStatusLabel[ReportStatus.REJECTED]}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* 처리 메시지 (전체 너비) */}
            {showProcessingNote && (
              <div className="space-y-2">
                <Label
                  htmlFor="processingNote"
                  className="text-sm font-semibold"
                >
                  처리 메시지 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="processingNote"
                  placeholder="처리 결과를 입력해주세요"
                  value={processingNote}
                  onChange={(e) => setProcessingNote(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            )}

            {/* 처리 이력 */}
            {report.processedAt && (
              <div className="p-4 bg-muted/30 rounded-lg border">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  처리 이력
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">상태:</span>
                    <Badge variant="outline">
                      {ReportStatusLabel[report.status]}
                    </Badge>
                    <span className="text-muted-foreground ml-2">
                      {format(new Date(report.processedAt), "PPP HH:mm", {
                        locale: ko,
                      })}
                    </span>
                  </div>
                  {report.processingNote && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">
                        처리 메시지:
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {report.processingNote}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 하단 버튼 */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                취소
              </Button>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                저장
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CategoryBadge({
  categoryMain,
  categoryDetail,
  detailLabel,
}: {
  categoryMain: ReportCategoryMain;
  categoryDetail: ReportCategoryDetail;
  detailLabel: Record<ReportCategoryDetail, string>;
}) {
  const color =
    categoryMain === ReportCategoryMain.VIOLATION
      ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-200"
      : categoryMain === ReportCategoryMain.ERROR
        ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200"
        : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-200";

  return (
    <Badge variant="outline" className={`gap-1 ${color}`}>
      <span>
        {categoryMain === ReportCategoryMain.VIOLATION
          ? "위반"
          : categoryMain === ReportCategoryMain.ERROR
            ? "오류"
            : "기타"}
      </span>
      <span className="text-[11px] text-muted-foreground">
        {detailLabel[categoryDetail]}
      </span>
    </Badge>
  );
}
