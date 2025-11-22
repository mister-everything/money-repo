import { pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { SCHEMA_NAME } from "./const";

export const reportSchema = pgSchema(SCHEMA_NAME);

/**
 * 신고의 대상 유형을 고정시키는 ENUM. solves/src/payment/schema.ts 참고함
 *  - QUIZBOOK: 문제집 전체에 대한 신고
 *  - QUIZ_BLOCK: 개별 문제에 대한 신고
 *  - OTHER: 일반 피드백/기타 문의
 */
export const reportTargetTypeEnum = reportSchema.enum("report_target_type", [
  "QUIZBOOK",
  "QUIZ_BLOCK",
  "OTHER",
]);

/**
 * content_reports: 모든 신고/피드백을 기록하는 테이블
 * 현재 단계에서는 가장 필요한 컬럼만 정의해 둔다 추후 바뀔 수 있음
 */
export const contentReportsTable = reportSchema.table("content_reports", {
  /**
   * id: 신고 레코드 고유 ID
   *  - UUID를 기본 키로 사용하여 다른 서비스/알림에서 참조하기 쉬움
   */
  id: uuid("id").primaryKey().defaultRandom(),

  /**
   * reported_at: 사용자가 신고 폼을 제출한 정확한 시각
   *  - 정렬, 필터링 등에 활용
   */
  reportedAt: timestamp("reported_at").notNull().defaultNow(),

  /**
   * reporter_user_id: 신고를 생성한 사용자 ID
   *  - auth.user.id 값을 문자열로 저장
   *  - 추후 distinct 신고자 수 계산 시 사용
   */
  reporterUserId: text("reporter_user_id").notNull(),

  /**
   * target_type: 신고 대상 구분
   *  - QUIZBOOK(퀴즈 전체 신고) / QUIZ_BLOCK(퀴즈 개별 문제) / OTHER(기타 피드백) 중 하나
   *  - target_id 해석 방법을 정의
   */
  targetType: reportTargetTypeEnum("target_type").notNull(),

  /**
   * target_id: 실제로 신고된 리소스의 식별자
   *  - 문제집/문제는 UUID를 문자열로 저장
   *  - 기타 피드백은 자유 텍스트(예: "화면 개선좀 해줘요 또는 질문 있습니다")
   */
  targetId: text("target_id").notNull(),

  /**
   * category: 신고 유형을 간단히 표현하는 문자열
   *  - 예: "ERROR_ANSWER", "VIOLATION"(위반), "OTHER" 등
   *  - 추후 ENUM 세분화 전에 임시로 사용
   */
  category: text("category").notNull(),

  /**
   * detail_text: 신고자 상세 내용
   *  - null 허용(필수 입력이 아닐 수 있기 때문)
   *  - 운영자가 이 내용을 바탕으로 검토
   */
  detailText: text("detail_text"),
});
