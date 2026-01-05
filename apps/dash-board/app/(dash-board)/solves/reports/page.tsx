import {
  ReportCategoryDetail,
  ReportCategoryMain,
  ReportStatus,
} from "@service/report/shared";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileWarning,
  Flame,
  MessageSquareWarning,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isSafeFail } from "@/lib/protocol/interface";
import { getReports } from "./actions";
import { ReportsFilters } from "./reports-filters";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ContentReportsPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const search = (searchParams.search as string) || "";
  const categoryMain = searchParams.categoryMain as
    | ReportCategoryMain
    | undefined;
  const status = searchParams.status as ReportStatus | undefined;
  const priorityOnly = searchParams.priorityOnly === "true";

  const result = await getReports({
    page,
    limit: 10,
    categoryMain,
    status,
    search,
    priorityOnly,
  });

  if (isSafeFail(result)) {
    throw new Error(result.message);
  }

  const { reports, totalCount, totalPages, stats } = result.data;

  // URL 쿼리 파라미터 생성
  const getPageUrl = (newPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(newPage));
    if (search) params.set("search", search);
    if (categoryMain) params.set("categoryMain", categoryMain);
    if (status) params.set("status", status);
    if (priorityOnly) params.set("priorityOnly", "true");
    return `/solves/reports?${params.toString()}`;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquareWarning className="h-8 w-8 text-orange-500" />
            신고 관리
          </h1>
          <p className="text-muted-foreground mt-2">
            사용자 신고를 검토하고 처리할 수 있습니다.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-500" />
              우선 검토 필요
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.priorityCount}
            </div>
            <p className="text-xs text-muted-foreground">
              5인 이상 동일 대상 신고
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              처리 대기중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingCount}
            </div>
            <p className="text-xs text-muted-foreground">
              RECEIVED + IN_REVIEW
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              오류 신고
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.errorCount}</div>
            <p className="text-xs text-muted-foreground">정답 오류, 오타 등</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              위반 신고
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.violationCount}</div>
            <p className="text-xs text-muted-foreground">
              저작권, 부적절 콘텐츠
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <ReportsFilters
        defaultSearch={search}
        defaultCategoryMain={categoryMain}
        defaultStatus={status}
        defaultPriorityOnly={priorityOnly}
      />

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>신고 목록 ({totalCount}건)</CardTitle>
          <CardDescription>
            신고를 클릭하면 상세 정보를 확인하고 처리할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquareWarning className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>조건에 맞는 신고가 없습니다.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">우선순위</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>대상 생성자</TableHead>
                    <TableHead className="max-w-[300px]">신고 내용</TableHead>
                    <TableHead>신고자</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>신고일</TableHead>
                    <TableHead className="w-[80px]">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow
                      key={report.id}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        report.isPriority
                          ? "bg-red-50/50 dark:bg-red-950/20"
                          : ""
                      }`}
                    >
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
                          categoryDetail={
                            report.categoryDetail as ReportCategoryDetail
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {report.targetOwnerName || "알 수 없음"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {report.targetOwnerEmail || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="text-sm truncate">
                          {report.detailText || "-"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {report.reporterName || "알 수 없음"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {report.reporterEmail || "-"}
                          </span>
                        </div>
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
                      <TableCell>
                        <Button variant="ghost" size="sm" disabled>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      {page > 1 && (
                        <PaginationItem>
                          <PaginationPrevious href={getPageUrl(page - 1)} />
                        </PaginationItem>
                      )}

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === totalPages ||
                            (p >= page - 2 && p <= page + 2)
                        )
                        .map((p, idx, arr) => {
                          if (idx > 0 && p - arr[idx - 1] > 1) {
                            return (
                              <>
                                <PaginationItem key={`ellipsis-${p}`}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                                <PaginationItem key={p}>
                                  <PaginationLink
                                    href={getPageUrl(p)}
                                    isActive={p === page}
                                  >
                                    {p}
                                  </PaginationLink>
                                </PaginationItem>
                              </>
                            );
                          }

                          return (
                            <PaginationItem key={p}>
                              <PaginationLink
                                href={getPageUrl(p)}
                                isActive={p === page}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                      {page < totalPages && (
                        <PaginationItem>
                          <PaginationNext href={getPageUrl(page + 1)} />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
// 나중에 api 붙을 때 수정
function CategoryBadge({
  categoryMain,
  categoryDetail,
}: {
  categoryMain: ReportCategoryMain;
  categoryDetail: ReportCategoryDetail | null;
}) {
  const config = {
    ERROR: {
      icon: AlertTriangle,
      label: "오류",
      className:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    },
    VIOLATION: {
      icon: AlertCircle,
      label: "위반",
      className:
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    },
    OTHER: {
      icon: FileWarning,
      label: "기타",
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    },
  };

  const { icon: Icon, label, className } = config[categoryMain];

  const detailLabels: Record<ReportCategoryDetail, string> = {
    ERROR_ANSWER: "정답 오류",
    ERROR_TYPO: "오타",
    ERROR_EXPLANATION: "설명 오류",
    VIOL_GUIDELINE: "가이드라인",
    VIOL_SPAM: "스팸",
    VIOL_TITLE: "연령/주제",
    VIOL_COPYRIGHT: "저작권",
    VIOL_PERSONAL_DATA: "개인정보",
    OTHER_SYSTEM: "시스템",
    OTHER_FREE: "자율 작성",
  };

  return (
    <div className="flex flex-col gap-1">
      <Badge variant="outline" className={`${className} gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
      {categoryDetail && (
        <span className="text-xs text-muted-foreground">
          {detailLabels[categoryDetail] || categoryDetail}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const config = {
    RECEIVED: {
      icon: Clock,
      label: "접수됨",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    IN_REVIEW: {
      icon: Eye,
      label: "검토중",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    RESOLVED: {
      icon: CheckCircle2,
      label: "처리완료",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    REJECTED: {
      icon: XCircle,
      label: "반려",
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <Badge variant="outline" className={`${className} gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
