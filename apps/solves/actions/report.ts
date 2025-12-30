"use server";

import { reportService } from "@service/report";
import { getSession } from "@/lib/auth/server";
import { safeAction } from "@/lib/protocol/server-action";

export const createReportAction = safeAction(async (input) => {
  const session = await getSession(); // 로그인 사용자

  const savedReport = await reportService.createReport({
    ...input,
    reporterUserId: session.user.id,
  });

  return savedReport;
});
