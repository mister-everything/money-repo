import { userTable } from "@service/auth";

import {
  boolean,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { SCHEMA_NAME } from "./const";
import {
  NotificationType,
  ReportCategoryDetail,
  ReportCategoryMain,
  ReportStatus,
  ReportTargetType,
} from "./types";

/**
 * reportSchema: 신고 도메인에서 사용할 전용 PostgreSQL 스키마 네임스페이스.
 */
export const reportSchema = pgSchema(SCHEMA_NAME);

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
    reporterUserId: text("reporter_user_id").references(() => userTable.id, {
      onDelete: "set null",
    }),

    /** 신고 대상 구분 */
    targetType: varchar("target_type", { length: 10 })
      .$type<ReportTargetType>()
      .notNull(),

    /** 신고된 리소스 ID (문제집/문제 UUID 또는 기타 문자열) */
    targetId: text("target_id").notNull(),

    /** 대분류: ERROR/VIOLATION/OTHER */
    categoryMain: varchar("category_main", { length: 10 })
      .$type<ReportCategoryMain>()
      .notNull(),

    /** 세부 유형: ERROR_ANSWER 등 */
    categoryDetail: varchar("category_detail", { length: 25 })
      .$type<ReportCategoryDetail>()
      .notNull(),

    /** 신고 상세 내용 */
    detailText: text("detail_text"),

    /** 처리 상태 */
    status: varchar("status", { length: 10 })
      .$type<ReportStatus>()
      .notNull()
      .default(ReportStatus.RECEIVED),

    /** 처리 담당자 auth.user.id (배정 전 null) */
    processorUserId: text("processor_user_id").references(() => userTable.id, {
      onDelete: "set null",
    }),

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
    // index("report_target_idx").on(table.targetType, table.targetId),
    // index("report_status_idx").on(table.status),
    // index("report_category_idx").on(table.categoryMain, table.categoryDetail),
    // index("report_date_idx").on(table.reportedAt), // 날짜별 조회/정렬용 인덱스 추가함
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
  notifType: varchar("notif_type", { length: 20 })
    .$type<NotificationType>()
    .notNull(),

  /** 관련 콘텐츠 ID (문제집, 신고 등) */
  relatedContentId: text("related_content_id"),

  /** 사용자에게 노출되는 메시지 */
  messageBody: text("message_body").notNull(),

  /** 읽음 여부 */
  isRead: boolean("is_read").notNull().default(false),
});
