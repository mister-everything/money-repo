import { userTable } from "@service/auth";

import {
  boolean,
  index,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { SCHEMA_NAME } from "./const";

/**
 * reportSchema: 신고 도메인에서 사용할 전용 PostgreSQL 스키마 네임스페이스.
 */
export const reportSchema = pgSchema(SCHEMA_NAME);

/** 신고 대상 유형 ENUM */
export const reportTargetTypeEnum = reportSchema.enum("report_target_type", [
  "QUIZBOOK",
  "QUIZ_BLOCK",
  "OTHER",
]);

/** 신고 대분류 ENUM */
export const reportCategoryMainEnum = reportSchema.enum(
  "report_category_main",
  ["ERROR", "VIOLATION", "OTHER"],
);

/** 신고 세부 유형 ENUM */
export const reportCategoryDetailEnum = reportSchema.enum(
  "report_category_detail",
  [
    "ERROR_ANSWER",
    "ERROR_TYPO",
    "ERROR_EXPLANATION",
    "VIOL_GUIDELINE",
    "VIOL_COPYRIGHT",
    "OTHER_SYSTEM",
    "OTHER_FREE",
  ],
);

/** 신고 처리 상태 ENUM */
export const reportStatusEnum = reportSchema.enum("report_status", [
  "RECEIVED",
  "IN_REVIEW",
  "RESOLVED",
  "REJECTED",
]);

/** 알림 유형 ENUM */
export const notificationTypeEnum = reportSchema.enum("notif_type", [
  "REPORT_COMPLETE",
  "CONTENT_WARN",
  "CONTENT_DELETE",
  "SYSTEM_NOTICE",
]);

/**
 * content_reports — 사용자 신고/피드백의 전 과정을 기록하는 핵심 테이블.
 */
export const contentReportsTable = reportSchema.table(
  "content_reports",
  {
    /** 신고 고유 ID (UUID) */
    id: uuid("id").primaryKey().defaultRandom(),

    /** 신고 접수 시각 */
    reportedAt: timestamp("reported_at").notNull().defaultNow(),

    /** 신고자 auth.user.id */
    reporterUserId: text("reporter_user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }), // 사용자 삭제 시 신고 내역도 삭제할지, set null 할지는 정책 결정 필요함 (일단 삭제),

    /** 신고 대상 구분 */
    targetType: reportTargetTypeEnum("target_type").notNull(),

    /** 신고된 리소스 ID (문제집/문제 UUID 또는 기타 문자열) */
    targetId: text("target_id").notNull(),

    /** 대분류: ERROR/VIOLATION/OTHER */
    categoryMain: reportCategoryMainEnum("category_main").notNull(),

    /** 세부 유형: ERROR_ANSWER 등 */
    categoryDetail: reportCategoryDetailEnum("category_detail").notNull(),

    /** 신고 상세 내용 */
    detailText: text("detail_text"),

    /** 처리 상태 */
    status: reportStatusEnum("status").notNull().default("RECEIVED"),

    /** 처리 담당자 auth.user.id (배정 전 null) */
    processorUserId: text("processor_user_id").references(() => userTable.id),

    /** 처리 완료/반려 시각 */
    processedAt: timestamp("processed_at"),

    /** 운영 메모 및 조치 기록 */
    processingNote: text("processing_note"),
  },
  (table) => [
    uniqueIndex("report_unique_user_target_detail").on(
      table.reporterUserId,
      table.targetType,
      table.targetId,
      table.categoryDetail,
    ),
    index("report_target_idx").on(table.targetType, table.targetId),
    index("report_status_idx").on(table.status),
    index("report_category_idx").on(table.categoryMain, table.categoryDetail),
    index("report_date_idx").on(table.reportedAt), // 날짜별 조회/정렬용 인덱스 추가함
  ],
);

/**
 * notifications — 신고 결과/조치 안내 알림을 저장.
 */
export const notificationsTable = reportSchema.table("notifications", {
  /** 알림 고유 ID */
  id: uuid("id").primaryKey().defaultRandom(),

  /** 수신자 auth.user.id */
  recipientUserId: text("recipient_user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),

  /** 생성된 시각 */
  sentAt: timestamp("sent_at").notNull().defaultNow(),

  /** 알림 유형 */
  notifType: notificationTypeEnum("notif_type").notNull(),

  /** 관련 콘텐츠 ID (문제집, 신고 등) */
  relatedContentId: text("related_content_id"),

  /** 사용자에게 노출되는 메시지 */
  messageBody: text("message_body").notNull(),

  /** 읽음 여부 */
  isRead: boolean("is_read").notNull().default(false),
});
