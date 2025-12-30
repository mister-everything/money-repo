import { pgDb } from "./db";
import { contentReportsTable } from "./schema";
import { CreateReportDto } from "./types";

export const reportService = {
  // 사용자가 문제를 신고
  async createReport(input: CreateReportDto) {
    const [inserted] = await pgDb
      .insert(contentReportsTable)
      .values({
        reporterUserId: input.reporterUserId,
        targetType: input.targetType,
        targetId: input.targetId,
        categoryMain: input.categoryMain,
        categoryDetail: input.categoryDetail,
        detailText: input.detailText,
      })
      .returning();

    return inserted;
  },
};
