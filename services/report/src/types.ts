import { z } from "zod";

export enum ReportTargetType {
  WORKBOOK = "WORKBOOK",
  BLOCK = "BLOCK",
  OTHER = "OTHER",
}

export enum ReportCategoryMain {
  ERROR = "ERROR", // 서비스 에러
  VIOLATION = "VIOLATION", // 위반 내용
  OTHER = "OTHER", // 기타
}

export enum ReportCategoryDetail {
  ERROR_ANSWER = "ERROR_ANSWER", // 답변 에러
  ERROR_TYPO = "ERROR_TYPO", // 오타 에러
  ERROR_EXPLANATION = "ERROR_EXPLANATION", // 설명 에러
  VIOL_GUIDELINE = "VIOL_GUIDELINE", // 가이드라인 위반
  VIOL_COPYRIGHT = "VIOL_COPYRIGHT", // 저작권 위반
  OTHER_SYSTEM = "OTHER_SYSTEM", // 시스템 에러
  OTHER_FREE = "OTHER_FREE", // 기타
}

export enum ReportStatus {
  RECEIVED = "RECEIVED", // 신고 접수
  IN_REVIEW = "IN_REVIEW", // 처리 중
  RESOLVED = "RESOLVED", // 처리 완료
  REJECTED = "REJECTED", // 반려
}

export enum NotificationType {
  REPORT_COMPLETE = "REPORT_COMPLETE", // 신고 처리 완료
  CONTENT_WARN = "CONTENT_WARN", // 콘텐츠 경고
  CONTENT_DELETE = "CONTENT_DELETE", // 콘텐츠 삭제
  SYSTEM_NOTICE = "SYSTEM_NOTICE", // 시스템 알림
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
