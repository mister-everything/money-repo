import { z } from "zod";

/**
 * 신고 대상 유형 상수.
 *  - QUIZBOOK  : 문제집 전체에 대한 신고
 *  - QUIZ_BLOCK: 개별 문제(블록)에 대한 신고
 *  - OTHER     : 일반 피드백/기타 문의
 */
export const reportTargetTypes = ["QUIZBOOK", "QUIZ_BLOCK", "OTHER"] as const;

export type ReportTargetType = typeof reportTargetTypes;

/**
 * 신고 유형 상수.
 *  - ERROR_* : 내용/형식 오류 계열
 *  - VIOL_*  : 정책 위반/저작권
 *  - OTHER_* : 시스템 오류 및 일반 피드백
 */
export const reportCategories = [
  "ERROR_ANSWER",
  "ERROR_TYPO",
  "ERROR_EXPLANATION",
  "VIOL_GUIDELINE",
  "VIOL_COPYRIGHT",
  "OTHER_SYSTEM",
  "OTHER_FREE",
] as const;

export type ReportCategory = typeof reportCategories;

/**
 * content_reports 행을 표현하는 타입.
 */
export interface ContentReport {
  id: string;
  reportedAt: Date;
  /** auth.user.id 값. 신고자를 명확히 추적. */
  reporterUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  category: ReportCategory;
  detailText: string | null;
}

/**
 * 신고 생성 입력 DTO.
 */
export interface CreateReportInput {
  /** better-auth 세션에서 가져온 auth.user.id */
  reporterUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  category: ReportCategory;
  detailText?: string | null;
}

/**
 * 신고 생성 요청 유효성 검사 스키마.
 */
export const createReportSchema = z.object({
  reporterUserId: z.string().min(1, "신고자 ID(auth.user.id)가 필요합니다."),
  targetType: z.enum(reportTargetTypes),
  targetId: z.string().min(1, "신고 대상 ID가 필요합니다."),
  category: z.enum(reportCategories),
  detailText: z.string().optional(),
});

export type CreateReportDto = z.infer<typeof createReportSchema>;
