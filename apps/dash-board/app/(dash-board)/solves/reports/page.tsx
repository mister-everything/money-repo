import { ReportCategoryMain, ReportStatus } from "@service/report/shared";
import {
  AlertCircle,
  AlertTriangle,
  ClockIcon,
  FileQuestion,
  Flame,
  MessageSquareWarning,
} from "lucide-react";

import { ReportsData, ReportTable } from "@/components/solves/report-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { isSafeFail } from "@/lib/protocol/interface";
import { getReports } from "./actions";
import { ReportsFilters } from "./reports-filters";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ReportsPage(props: {
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
    limit: 5,
    categoryMain,
    status,
    search,
    priorityOnly,
  });

  if (isSafeFail(result)) {
    throw new Error(result.message);
  }

  const data = result.data as ReportsData;

  const stats = data.stats;

  const baseQuery = `${search ? `&search=${encodeURIComponent(search)}` : ""}${
    categoryMain ? `&categoryMain=${encodeURIComponent(categoryMain)}` : ""
  }${status ? `&status=${encodeURIComponent(status)}` : ""}${
    priorityOnly ? "&priorityOnly=true" : ""
  }`;

  return (
    <div className="container mx-auto py-8 space-y-6">
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

      <section className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-500" />
              우선 검토 필요
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.priorityCount}</div>
            <p className="text-xs text-muted-foreground">
              5인 이상 동일 대상 신고
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-yellow-500" />
              처리 대기중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
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

        <Card className="border-l-4 border-l-slate-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileQuestion className="h-4 w-4 text-slate-500" />
              기타 신고
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.otherCount}</div>
            <p className="text-xs text-muted-foreground">OTHER 카테고리</p>
          </CardContent>
        </Card>
      </section>

      <ReportsFilters
        defaultSearch={search}
        defaultCategoryMain={categoryMain}
        defaultStatus={status}
        defaultPriorityOnly={priorityOnly}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            신고 목록 ({data.totalCount.toLocaleString()}건)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.reports.length > 0 ? (
            <ReportTable reports={data.reports} />
          ) : (
            <p className="text-center text-muted-foreground py-12">
              조건에 맞는 신고가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {data.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href={`/solves/reports?page=${page - 1}${baseQuery}`}
                />
              </PaginationItem>
            )}

            {Array.from({ length: data.totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === data.totalPages ||
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
                          href={`/solves/reports?page=${p}${baseQuery}`}
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
                      href={`/solves/reports?page=${p}${baseQuery}`}
                      isActive={p === page}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

            {page < data.totalPages && (
              <PaginationItem>
                <PaginationNext
                  href={`/solves/reports?page=${page + 1}${baseQuery}`}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
