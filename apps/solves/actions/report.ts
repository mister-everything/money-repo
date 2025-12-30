"use server";

import { reportService } from "@service/report";
import { createReportSchema } from "@service/report/shared";
import z from "zod";
import { getSession } from "@/lib/auth/server";
import { safeAction } from "@/lib/protocol/server-action";

export const createReportAction = safeAction(
  async (input: Omit<z.infer<typeof createReportSchema>, "reporterUserId">) => {
    const session = await getSession(); // 로그인 사용자

    const savedReport = await reportService.createReport({
      ...input,
      reporterUserId: session.user.id,
    });

    return savedReport;
  },
);
