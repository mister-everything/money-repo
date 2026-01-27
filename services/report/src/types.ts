import { z } from "zod";

export enum ReportTargetType {
  WORKBOOK = "WORKBOOK",
  BLOCK = "BLOCK",
  COMMENT = "COMMENT",
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
  VIOL_SPAM = "VIOL_SPAM", // 도배 및 스팸
  VIOL_TITLE = "VIOL_TITLE", // 연령과 주제 위반
  VIOL_COPYRIGHT = "VIOL_COPYRIGHT", // 저작권 위반
  VIOL_PERSONAL_DATA = "VIOL_PERSONAL_DATA", // 개인정보 유출
  OTHER_SYSTEM = "OTHER_SYSTEM", // 시스템 에러
  OTHER_FREE = "OTHER_FREE", // 기타
  // 댓글 신고 전용
  COMMENT_SPAM = "COMMENT_SPAM", // 도배/스팸
  COMMENT_ABUSE = "COMMENT_ABUSE", // 욕설/괴롭힘
  COMMENT_HATE = "COMMENT_HATE", // 혐오표현
  COMMENT_SEXUAL = "COMMENT_SEXUAL", // 성적/선정
  COMMENT_PERSONAL = "COMMENT_PERSONAL", // 개인정보 노출
  COMMENT_OTHER = "COMMENT_OTHER", // 기타
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

export type ReportDraft = Omit<CreateReportInput, "reporterUserId">;

export const REPORT_REASON_SECTIONS = [
  {
    main: ReportCategoryMain.ERROR,
    heading: "오류 (Error)",
    reasons: [
      { detail: ReportCategoryDetail.ERROR_ANSWER, label: "정답이 틀렸어요" },
      {
        detail: ReportCategoryDetail.ERROR_TYPO,
        label: "문제 또는 보기에 오탈자가 있어요",
      },
      {
        detail: ReportCategoryDetail.ERROR_EXPLANATION,
        label: "해설이 부정확하거나 부적절해요",
      },
    ],
  },
  {
    main: ReportCategoryMain.VIOLATION,
    heading: "위반 (Violation)",
    reasons: [
      {
        detail: ReportCategoryDetail.VIOL_GUIDELINE,
        label: "가이드라인을 위반했어요",
      },
      {
        detail: ReportCategoryDetail.VIOL_SPAM,
        label: "도배 및 스팸 내용이 있어요",
      },
      {
        detail: ReportCategoryDetail.VIOL_TITLE,
        label: "연령과 주제를 위반했어요",
      },
      {
        detail: ReportCategoryDetail.VIOL_COPYRIGHT,
        label: "저작권을 침해했어요",
      },
      {
        detail: ReportCategoryDetail.VIOL_PERSONAL_DATA,
        label: "개인정보를 유출했어요",
      },
    ],
  },
  {
    main: ReportCategoryMain.OTHER,
    heading: "기타 (Other)",
    reasons: [
      {
        detail: ReportCategoryDetail.OTHER_SYSTEM,
        label: "기타 시스템 오류를 발견했어요",
      },
      { detail: ReportCategoryDetail.OTHER_FREE, label: "자율 작성" },
    ],
  },
] as const;

export const COMMENT_REPORT_REASON_SECTIONS = [
  {
    main: ReportCategoryMain.VIOLATION,
    heading: "위반 (Violation)",
    reasons: [
      {
        detail: ReportCategoryDetail.COMMENT_SPAM,
        label: "도배 및 스팸이에요",
      },
      {
        detail: ReportCategoryDetail.COMMENT_ABUSE,
        label: "욕설/괴롭힘이 있어요",
      },
      { detail: ReportCategoryDetail.COMMENT_HATE, label: "혐오표현이 있어요" },
      {
        detail: ReportCategoryDetail.COMMENT_SEXUAL,
        label: "성적/선정적 내용이에요",
      },
      {
        detail: ReportCategoryDetail.COMMENT_PERSONAL,
        label: "개인정보를 노출했어요",
      },
    ],
  },
  {
    main: ReportCategoryMain.OTHER,
    heading: "기타 (Other)",
    reasons: [
      { detail: ReportCategoryDetail.COMMENT_OTHER, label: "기타 사유" },
    ],
  },
] as const;

export const ReportCategoryDetailLabel: Record<ReportCategoryDetail, string> = {
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

export const ReportStatusLabel: Record<ReportStatus, string> = {
  [ReportStatus.RECEIVED]: "접수됨",
  [ReportStatus.IN_REVIEW]: "검토중",
  [ReportStatus.RESOLVED]: "처리완료",
  [ReportStatus.REJECTED]: "반려",
};
