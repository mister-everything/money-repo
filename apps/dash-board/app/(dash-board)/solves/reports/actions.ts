"use server";

import { reportService } from "@service/report";
import { ReportCategoryMain, ReportStatus } from "@service/report/shared";
import z from "zod";
import { getUser } from "@/lib/auth/server";
import { safeAction } from "@/lib/protocol/server-action";

// users 참고
export const getReports = safeAction(
  z.object({
    page: z.number().optional().default(1),
    limit: z.number().optional().default(10),
    categoryMain: z
      .enum([
        ReportCategoryMain.ERROR,
        ReportCategoryMain.VIOLATION,
        ReportCategoryMain.OTHER,
      ])
      .optional(),
    status: z
      .enum([
        ReportStatus.RECEIVED,
        ReportStatus.IN_REVIEW,
        ReportStatus.RESOLVED,
        ReportStatus.REJECTED,
      ])
      .optional(),
    search: z.string().optional(),
    priorityOnly: z.boolean().optional().default(false),
  }),
  async ({ page, limit, categoryMain, status, search, priorityOnly }) => {
    await getUser(); // 인증 확인

    const result = await reportService.listReportsWithPagination({
      page,
      limit,
      categoryMain,
      status,
      search,
      priorityOnly,
    });

    return {
      reports: result.reports.map((report) => {
        const isPending =
          report.status === ReportStatus.RECEIVED ||
          report.status === ReportStatus.IN_REVIEW;

        const reporterCount = Number(report.reporterCount ?? 0);

        return {
          ...report,
          reportedAt: report.reportedAt.toISOString(),
          processedAt: report.processedAt?.toISOString() ?? null,
          reportCount: reporterCount,
          isPriority: reporterCount >= 5 && isPending,
          targetTitle: report.targetTitle,
        };
      }),
      totalCount: result.totalCount,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      stats: {
        priorityCount: Number(result.stats.priorityCount ?? 0),
        pendingCount: Number(result.stats.pendingCount ?? 0),
        errorCount: Number(result.stats.errorCount ?? 0),
        violationCount: Number(result.stats.violationCount ?? 0),
        otherCount: Number(result.stats.otherCount ?? 0),
      },
    };
  },
);
