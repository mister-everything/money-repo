"use client";

import {
  ReportCategoryDetail,
  ReportCategoryMain,
  ReportStatus,
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
  reporterUserId: string | null;
  reporterName: string | null;
  reporterEmail: string | null;
  targetType: string;
  targetId: string;
  targetOwnerId: string | null;
  targetOwnerName: string | null;
  targetOwnerEmail: string | null;
  targetTitle: string | null;
  targetIsPublic: boolean | null;
  categoryMain: ReportCategoryMain;
  categoryDetail: ReportCategoryDetail;
  detailText: string | null;
  status: ReportStatus;
  processorUserId: string | null;
  processorName: string | null;
  processorEmail: string | null;
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
    ReportStatus.RECEIVED
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

  const detailLabel: Record<ReportCategoryDetail, string> = {
    [ReportCategoryDetail.ERROR_ANSWER]: "정답 오류",
    [ReportCategoryDetail.ERROR_TYPO]: "오타 오류",
    [ReportCategoryDetail.ERROR_EXPLANATION]: "해설 오류",
    [ReportCategoryDetail.VIOL_GUIDELINE]: "가이드라인 위반",
    [ReportCategoryDetail.VIOL_SPAM]: "스팸/도배",
    [ReportCategoryDetail.VIOL_TITLE]: "연령·주제 위반",
    [ReportCategoryDetail.VIOL_COPYRIGHT]: "저작권 위반",
    [ReportCategoryDetail.VIOL_PERSONAL_DATA]: "개인정보 노출",
    [ReportCategoryDetail.OTHER_SYSTEM]: "시스템 오류",
    [ReportCategoryDetail.OTHER_FREE]: "기타",
  };

  const statusLabel: Record<ReportStatus, string> = {
    [ReportStatus.RECEIVED]: "접수됨",
    [ReportStatus.IN_REVIEW]: "검토중",
    [ReportStatus.RESOLVED]: "처리완료",
    [ReportStatus.REJECTED]: "반려",
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
          <div className="space-y-6">
            {/* 상단: 신고 정보 */}
            <div className="space-y-4 pb-6 border-b">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">접수 시각</p>
                  <p className="text-sm">
                    {format(new Date(report.reportedAt), "PPP HH:mm", {
                      locale: ko,
                    })}
                  </p>
                </div>
              </div>

              {report.isPriority && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                  <Flame className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-400">
                      우선 검토 필요
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-500">
                      {report.reportCount}명 이상이 동일 대상을 신고했습니다
                    </p>
                  </div>
                </div>
              )}

              {report.categoryDetail ===
                ReportCategoryDetail.VIOL_COPYRIGHT && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                    이 신고는 즉시 비공개 조치가 필요합니다!
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">분류</p>
                <CategoryBadge
                  categoryMain={report.categoryMain}
                  categoryDetail={report.categoryDetail}
                  detailLabel={detailLabel}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">신고 내용</p>
                <p className="text-sm p-3 bg-muted rounded-lg whitespace-pre-wrap">
                  {report.detailText || "-"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">신고 대상</p>
                  <div className="p-3 bg-muted rounded-lg space-y-1">
                    <p className="text-sm font-semibold">
                      {report.targetTitle || "-"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      생성자: {report.targetOwnerName || "알 수 없음"} (
                      {report.targetOwnerEmail || "-"})
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        공개 상태:
                      </span>
                      <Badge
                        variant={
                          report.targetIsPublic ? "default" : "secondary"
                        }
                      >
                        {report.targetIsPublic ? "공개 중" : "비공개"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">신고자</p>
                  <div className="p-3 bg-muted rounded-lg space-y-1">
                    <p className="text-sm font-semibold">
                      {report.reporterName || "알 수 없음"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {report.reporterEmail || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단: 처리 영역 */}
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>처리 상태</Label>
                <RadioGroup
                  value={selectedStatus}
                  onValueChange={(value) =>
                    setSelectedStatus(value as ReportStatus)
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={ReportStatus.RECEIVED}
                      id="received"
                    />
                    <Label htmlFor="received" className="cursor-pointer">
                      {statusLabel[ReportStatus.RECEIVED]}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={ReportStatus.IN_REVIEW}
                      id="in_review"
                    />
                    <Label htmlFor="in_review" className="cursor-pointer">
                      {statusLabel[ReportStatus.IN_REVIEW]}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={ReportStatus.RESOLVED}
                      id="resolved"
                    />
                    <Label htmlFor="resolved" className="cursor-pointer">
                      {statusLabel[ReportStatus.RESOLVED]}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={ReportStatus.REJECTED}
                      id="rejected"
                    />
                    <Label htmlFor="rejected" className="cursor-pointer">
                      {statusLabel[ReportStatus.REJECTED]}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {showProcessingNote && (
                <div className="space-y-2">
                  <Label htmlFor="processingNote">
                    처리 메시지 <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="processingNote"
                    placeholder="처리 결과를 입력해주세요"
                    value={processingNote}
                    onChange={(e) => setProcessingNote(e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              {report.processedAt && (
                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">처리 이력</p>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">
                        이전 처리 상태:
                      </span>{" "}
                      <Badge variant="outline" className="ml-1">
                        {statusLabel[report.status]}
                      </Badge>
                    </p>
                    <p>
                      <span className="text-muted-foreground">처리자:</span>{" "}
                      {report.processorName || "알 수 없음"} (
                      {report.processorEmail || "-"})
                    </p>
                    <p>
                      <span className="text-muted-foreground">처리 시각:</span>{" "}
                      {format(new Date(report.processedAt), "PPP HH:mm", {
                        locale: ko,
                      })}
                    </p>
                    {report.processingNote && (
                      <div className="mt-2">
                        <p className="text-muted-foreground mb-1">
                          이전 처리 메시지:
                        </p>
                        <p className="whitespace-pre-wrap p-2 bg-background rounded">
                          {report.processingNote}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
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
