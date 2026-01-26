"use client";

import {
  ReportCategoryDetail,
  ReportCategoryMain,
  ReportStatus,
} from "@service/report/shared";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Eye, EyeOff, Flame, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleWorkbookPublic } from "@/app/(dash-board)/solves/reports/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isSafeFail } from "@/lib/protocol/interface";
import { notify } from "../ui/notify";
import { ReportDetailDialog } from "./report-detail-dialog";
export type ReportListItem = {
  id: string;
  reportedAt: string;
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

export type ReportsData = {
  reports: ReportListItem[];
  totalCount: number;
  totalPages: number;
  stats: {
    priorityCount: number;
    pendingCount: number;
    errorCount: number;
    violationCount: number;
    otherCount: number;
  };
};

type Props = {
  reports: ReportListItem[];
};

export function ReportTable({ reports }: Props) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const handleRowClick = (reportId: string) => {
    setSelectedReportId(reportId);
    setDialogOpen(true);
  };

  const handleTogglePublic = async (
    e: React.MouseEvent,
    report: ReportListItem
  ) => {
    e.stopPropagation();

    if (!report.targetId) return;

    const newIsPublic = !report.targetIsPublic;
    const confirmMessage = newIsPublic
      ? "공개 하시겠습니까?"
      : "비공개 하시겠습니까?";

    const confirmed = await notify.confirm({ title: confirmMessage });
    if (!confirmed) return;

    setTogglingId(report.id);
    startTransition(async () => {
      const result = await toggleWorkbookPublic({
        workBookId: report.targetId,
        targetOwnerId: report.targetOwnerId ?? "",
        isPublic: newIsPublic,
      });
      if (isSafeFail(result)) {
        notify.alert({ title: `오류: ${result.message}` });
      } else {
        router.refresh();
      }

      setTogglingId(null);
    });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">공개 상태</TableHead>
            <TableHead className="w-[100px]">우선순위</TableHead>
            <TableHead>카테고리</TableHead>
            <TableHead>신고 문제집 제목</TableHead>
            <TableHead className="max-w-[300px]">신고 내용</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>신고일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow
              key={report.id}
              onClick={() => handleRowClick(report.id)}
              className={`cursor-pointer ${
                report.isPriority ? "bg-red-50/50 dark:bg-red-950/20" : ""
              }`}
            >
              <TableCell>
                <Button
                  size="sm"
                  variant={
                    report.categoryDetail ===
                    ReportCategoryDetail.VIOL_COPYRIGHT
                      ? "destructive"
                      : report.targetIsPublic
                      ? "default"
                      : "outline"
                  }
                  onClick={(e) => handleTogglePublic(e, report)}
                  disabled={togglingId === report.id}
                  className="gap-1"
                >
                  {togglingId === report.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : report.targetIsPublic ? (
                    <>
                      <Eye className="h-4 w-4" />
                      공개
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4" />
                      비공개
                    </>
                  )}
                </Button>
              </TableCell>
              <TableCell>
                {report.isPriority ? (
                  <Badge className="bg-red-500 hover:bg-red-600 gap-1">
                    <Flame className="h-3 w-3" />
                    {report.reportCount}명
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    일반
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <CategoryBadge
                  categoryMain={report.categoryMain}
                  categoryDetail={report.categoryDetail}
                />
              </TableCell>
              <TableCell className="max-w-[200px]">
                <p className="text-sm truncate">{report.targetTitle || "-"}</p>
              </TableCell>
              <TableCell className="max-w-[300px]">
                <p className="text-sm truncate">{report.detailText || "-"}</p>
              </TableCell>
              <TableCell>
                <StatusBadge status={report.status} />
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(report.reportedAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ReportDetailDialog
        reportId={selectedReportId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}

function CategoryBadge({
  categoryMain,
  categoryDetail,
}: {
  categoryMain: ReportCategoryMain;
  categoryDetail: ReportCategoryDetail;
}) {
  const color =
    categoryMain === ReportCategoryMain.VIOLATION
      ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-200"
      : categoryMain === ReportCategoryMain.ERROR
      ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200"
      : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-200";

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
    [ReportCategoryDetail.COMMENT_SPAM]: "도배/스팸",
    [ReportCategoryDetail.COMMENT_ABUSE]: "욕설/괴롭힘",
    [ReportCategoryDetail.COMMENT_HATE]: "혐오표현",
    [ReportCategoryDetail.COMMENT_SEXUAL]: "성적/선정적 내용",
    [ReportCategoryDetail.COMMENT_PERSONAL]: "개인정보 노출",
    [ReportCategoryDetail.COMMENT_OTHER]: "기타",
  };

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

function StatusBadge({ status }: { status: ReportStatus }) {
  const label: Record<ReportStatus, string> = {
    [ReportStatus.RECEIVED]: "접수됨",
    [ReportStatus.IN_REVIEW]: "검토중",
    [ReportStatus.RESOLVED]: "처리완료",
    [ReportStatus.REJECTED]: "반려",
  };
  const color: Record<ReportStatus, string> = {
    [ReportStatus.RECEIVED]:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-200",
    [ReportStatus.IN_REVIEW]:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200",
    [ReportStatus.RESOLVED]:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-200",
    [ReportStatus.REJECTED]:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-200",
  };

  return (
    <Badge variant="outline" className={color[status]}>
      {label[status]}
    </Badge>
  );
}
