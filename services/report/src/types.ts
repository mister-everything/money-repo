import { z } from "zod";

export enum ReportTargetType {
  QUIZBOOK = "QUIZBOOK",
  QUIZ_BLOCK = "QUIZ_BLOCK",
  OTHER = "OTHER",
}

export enum ReportCategoryMain {
  ERROR = "ERROR",
  VIOLATION = "VIOLATION",
  OTHER = "OTHER",
}

export enum ReportCategoryDetail {
  ERROR_ANSWER = "ERROR_ANSWER",
  ERROR_TYPO = "ERROR_TYPO",
  ERROR_EXPLANATION = "ERROR_EXPLANATION",
  VIOL_GUIDELINE = "VIOL_GUIDELINE",
  VIOL_COPYRIGHT = "VIOL_COPYRIGHT",
  OTHER_SYSTEM = "OTHER_SYSTEM",
  OTHER_FREE = "OTHER_FREE",
}

export enum ReportStatus {
  RECEIVED = "RECEIVED",
  IN_REVIEW = "IN_REVIEW",
  RESOLVED = "RESOLVED",
  REJECTED = "REJECTED",
}

export enum NotificationType {
  REPORT_COMPLETE = "REPORT_COMPLETE",
  CONTENT_WARN = "CONTENT_WARN",
  CONTENT_DELETE = "CONTENT_DELETE",
  SYSTEM_NOTICE = "SYSTEM_NOTICE",
}
export interface CreateReportInput {
  /** better-auth 세션에서 가져온 auth.user.id */
  reporterUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  categoryMain: ReportCategoryMain;
  categoryDetail: ReportCategoryDetail;
  detailText?: string | null;
}

export const createReportSchema = z.object({
  reporterUserId: z.string().min(1, "신고자 ID(auth.user.id)가 필요합니다."),
  targetType: z.enum(Object.values(ReportTargetType)),
  targetId: z.string().min(1, "신고 대상 ID가 필요합니다."),
  categoryMain: z.enum(Object.values(ReportCategoryMain)),
  categoryDetail: z.enum(Object.values(ReportCategoryDetail)),
  detailText: z.string().nullish(),
});

export type CreateReportDto = z.infer<typeof createReportSchema>;
