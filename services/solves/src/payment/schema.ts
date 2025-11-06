import { userTable } from "@service/auth";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  numeric as decimal,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { solvesSchema } from "../db";
import { PlanContentBlock, TxnKind } from "./types";

const timestamps = {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date()),
};

/**
 * AI Provider 가격 테이블
 *
 * 목적: AI 모델별 원가 및 마진 관리
 * 캐싱: 1시간 TTL (가격 변동 거의 없음)
 *
 * 사용 시나리오:
 * - 크레딧 차감 시 실시간 가격 조회 (캐시 우선)
 * - 관리자 가격 업데이트 (캐시 무효화 필수)
 */
export const AiProviderPricesTable = solvesSchema.table(
  "ai_provider_prices",
  {
    /** 고유 ID
     *  eg: "1c0c1b1e-2e0d-4c60-9e2d-0af5a8d9c1aa"
     */
    id: uuid("id").primaryKey().defaultRandom(),

    /** AI 제공자 (벤더)
     *  eg: "openai", "gemini", "claude", "xai"
     */
    provider: text("provider").notNull(),

    /** 모델명
     *  eg: "gpt-4o-mini", "claude-3-5-sonnet-20241022", "grok-2-latest"
     */
    model: text("model").notNull(),

    /** 모델 타입 (과금 방식 구분)
     *  eg: "text", "image", "audio", "video", "embedding"
     */
    modelType: text("model_type").notNull(),

    /** 입력 토큰 단가 (원화, 1M 토큰 기준)
     *  eg: "1950.00" (1950원 per 1M tokens)
     */
    inputTokenPrice: decimal("input_token_price", {
      precision: 15,
      scale: 2,
    }).notNull(),

    /** 출력 토큰 단가 (원화, 1M 토큰 기준)
     *  eg: "7800.00" (7800원 per 1M tokens)
     */
    outputTokenPrice: decimal("output_token_price", {
      precision: 15,
      scale: 2,
    }).notNull(),

    /** 캐시 토큰 단가 (원화, 1M 토큰 기준)
     *  프롬프트 캐싱 사용 시 할인된 가격
     *  일반적으로 입력 토큰의 10-50% 수준
     *  eg: "975.00" (입력 토큰 50% 할인)
     */
    cachedTokenPrice: decimal("cached_token_price", {
      precision: 15,
      scale: 2,
    }).notNull(),

    /** 마진율 (청구금액 = 원가 × markupRate)
     *  eg: "1.60" (60% 마진), "2.00" (100% 마진)
     */
    markupRate: decimal("markup_rate", { precision: 6, scale: 3 })
      .notNull()
      .default("1.60"),

    /** 활성화 여부
     *  비활성 모델은 가격 조회에서 제외됨
     *  eg: true, false
     */
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    /** 가격 조회 최적화 (provider + model 조합으로 조회) */
    uniqueIndex("ai_provider_prices_provider_model_idx").on(
      t.provider,
      t.model,
    ),
  ],
);

/**
 * 크레딧 지갑 테이블
 *
 * 목적: 사용자별 현재 크레딧 잔액 관리 (빠른 조회)
 * 캐싱: 10분 TTL (빠른 응답 우선)
 *
 * 동시성 제어:
 * - 차감: Optimistic Lock (version 컬럼 활용, 3회 재시도)
 * - 충전: Pessimistic Lock (FOR UPDATE)
 *
 * 빠른 응답 전략:
 * - 채팅 시 balance > 0만 체크 (캐시)
 * - 백그라운드 차감 (비동기)
 * - 일시적 음수 허용 후 0으로 처리 가능
 *
 * 데이터 정합성:
 * balance = SUM(CreditLedger.delta) (원장 기반 복구 가능)
 */
export const CreditWalletTable = solvesSchema.table(
  "credit_wallet",
  {
    /** 고유 ID
     *  eg: "3a5b6c7d-8e9f-4011-a1b2-3c4d5e6f7a8b"
     */
    id: uuid("id").primaryKey().defaultRandom(),

    /** 지갑 소유자
     *  FK: userTable.id (cascade delete)
     *  eg: "user_abc123..."
     */
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    /** 현재 크레딧 잔액
     *  정밀도: decimal(15, 2) - 소수점 2자리
     *  eg: "1250.00", "1.50"
     */
    balance: decimal("balance", { precision: 15, scale: 2 })
      .notNull()
      .default("0.00"),

    /** 낙관적 락 버전
     *  동시성 제어: UPDATE WHERE version = :expected
     *  충돌 시 재시도 (최대 3회)
     *  eg: 0 → 1 → 2 → ...
     */
    version: integer("version").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    /** 사용자당 1개 지갑만 허용 */
    uniqueIndex("credit_wallet_user_unique").on(t.userId),

    /** 음수 잔액 방지 (일반적으로)
     *  Note: 백그라운드 차감 시 일시적 음수 허용 가능 (빠른 응답 우선)
     *  애플리케이션 레벨에서 0으로 보정
     */
    check("balance_non_negative", sql`${t.balance} >= 0`),
  ],
);

/**
 * 크레딧 원장 테이블 (Immutable Ledger)
 *
 * 목적: 모든 크레딧 변동 기록 (append-only, 불변)
 * 패턴: Event Sourcing - 지갑 잔액의 신뢰할 수 있는 출처
 *
 * 멱등성 보장:
 * - uniqueIndex(walletId, idempotencyKey)로 중복 방지
 * - 캐시 실패 시에도 DB 레벨에서 보장
 *
 * 데이터 라이프사이클:
 * - Hot: 1년 (PostgreSQL 메인 테이블)
 * - Cold: 1년+ (S3 아카이브, 추후 구현)
 */
export const CreditLedgerTable = solvesSchema.table(
  "credit_ledger",
  {
    /** 고유 ID
     *  eg: "8f9e1a2b-3c4d-5e6f-7a8b-9c0d1e2f3a4b"
     */
    id: uuid("id").primaryKey().defaultRandom(),

    walletId: uuid("wallet_id")
      .notNull()
      .references(() => CreditWalletTable.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    /** 트랜잭션 종류
     *  eg: "purchase", "debit", "subscription_refill"
     */
    kind: text("kind").$type<TxnKind>().notNull(),

    /** 증감 크레딧
     *  양수: 적립 (purchase, grant, refill)
     *  음수: 차감 (debit, reset)
     *  eg: "+100.00", "-13.50"
     */
    delta: decimal("delta", { precision: 15, scale: 2 }).notNull(),

    /** 트랜잭션 직후 잔액 스냅샷
     *  복구/감사/리포팅에 유용
     *  eg: "987.50"
     */
    runningBalance: decimal("running_balance", {
      precision: 15,
      scale: 2,
    }).notNull(),

    /** 멱등성 키
     *  중복 요청 방지 (재시도, 네트워크 오류 등)
     *  eg: "req_20251014_abc123", "usage_event_xyz"
     */
    idempotencyKey: text("idempotency_key").notNull(),

    /** 트랜잭션 사유/출처
     *  eg: "invoice:inv_001", "promo:WELCOME20", "AI usage: gpt-4o-mini"
     */
    reason: text("reason"),

    /** 생성 시각 (수정 없음 - immutable) */
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    /** 트랜잭션 종류별 조회 최적화 */
    index("credit_ledger_kind_created_idx").on(t.kind, t.createdAt),
    /** 사용자별 거래 내역 조회 */
    index("credit_ledger_user_idx").on(t.userId),
    /** 멱등성 보장 (지갑당 중복 키 방지) */
    uniqueIndex("credit_ledger_wallet_idemp_uniq").on(
      t.walletId,
      t.idempotencyKey,
    ),
  ],
);

/**
 * AI 사용 이벤트 테이블
 *
 * 목적: AI API 사용 내역 상세 기록 (히스토리 보존)
 * 패턴: 비정규화 (성능 + 불변성)
 *
 * 비정규화 이유:
 * - priceId는 있지만 provider, model, vendorCostUsd 중복 저장
 * 1. 성능: JOIN 없이 빠른 리포팅 (GROUP BY provider, model)
 * 2. 히스토리: 가격 변경 시에도 과거 원가 불변
 * 3. 무결성: 모델 삭제 시에도 사용 기록 보존
 *
 * 멱등성 보장:
 * - uniqueIndex(walletId, idempotencyKey)로 중복 방지
 * - 동일 요청 재시도 시 중복 기록 방지
 *
 * 데이터 라이프사이클:
 * - Hot: 3개월 (PostgreSQL 메인 테이블)
 * - Warm: 1년 (집계 테이블로 요약, 추후 구현)
 * - Cold: 1년+ (S3 아카이브, 추후 구현)
 */
export const UsageEventsTable = solvesSchema.table(
  "usage_events",
  {
    /** 고유 ID
     *  eg: "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d"
     */
    id: uuid("id").primaryKey().defaultRandom(),

    /** 사용자 ID (실제 호출자)
     *  팀 지갑 사용 시에도 개인 추적 가능
     *  FK: userTable.id (restrict - 사용 기록 보존)
     *  eg: "user_abc123..."
     */
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),
    /** 가격 정보 ID
     *  사용 시점의 가격 스냅샷 참조
     *  FK: AiProviderPricesTable.id (restrict)
     *  eg: "price_def456..."
     */
    priceId: uuid("price_id")
      .notNull()
      .references(() => AiProviderPricesTable.id, { onDelete: "restrict" }),

    /** AI 제공자 (비정규화)
     *  리포팅 쿼리 성능 최적화
     *  eg: "openai", "anthropic", "google"
     */
    provider: text("provider").notNull(),

    /** AI 모델명 (비정규화)
     *  리포팅 쿼리 성능 최적화
     *  eg: "gpt-4o-mini", "claude-3-5-sonnet-20241022"
     */
    model: text("model").notNull(),

    /** API 호출 횟수
     *  이미지/오디오 등 per-request 과금용
     *  eg: 1, 5
     */
    calls: integer("calls"),

    /** 고객 청구 크레딧
     *  실제 차감된 크레딧 (원가 × markup)
     *  eg: "1.60" (원가 1.00원 × 1.6)
     */
    billableCredits: decimal("billable_credits", {
      precision: 15,
      scale: 2,
    }).notNull(),

    /** 멱등성 키
     *  중복 요청 방지
     *  eg: "req_20251014_xyz123", "chat_msg_abc"
     */
    idempotencyKey: text("request_id"),

    /** 생성 시각 */
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    /** 사용자별 활동 내역 조회 */
    index("usage_events_user_created_idx").on(t.userId, t.createdAt),
    /** 가격 정보별 조회 */
    index("usage_events_price_idx").on(t.priceId),
    /** 멱등성 보장 (사용자당 중복 키 방지) */
    uniqueIndex("usage_events_user_idemp_uniq").on(t.userId, t.idempotencyKey),
  ],
);

/**
 * 인보이스 (결제 기록) 테이블
 *
 * 목적: 모든 결제 내역 기록 (구독 결제 + 크레딧 구매)
 *
 * 결제 타입:
 * - "subscription": 월간 구독료 결제
 * - "credit_purchase": 추가 크레딧 구매
 *
 * 결제 흐름:
 * 1. pending: 결제 요청 생성
 * 2. paid: 결제 완료 → CreditLedgerTable에 purchase 기록
 * 3. failed: 결제 실패
 *
 * 외부 연동:
 * - externalRef: PG사 거래 ID (카카오페이, 토스페이 등)
 * - externalOrderId: PG사 주문 ID
 */
export const InvoiceStatusEnum = solvesSchema.enum("invoice_status", [
  "pending",
  "paid",
  "failed",
]);

export const InvoiceTypeEnum = solvesSchema.enum("invoice_type", [
  "subscription",
  "credit_purchase",
]);

export const InvoicesTable = solvesSchema.table(
  "invoices",
  {
    /** 고유 ID
     *  eg: "inv_abc123..."
     */
    id: uuid("id").primaryKey().defaultRandom(),

    /** 결제자 ID
     *  누가 결제했는지 추적
     *  FK: userTable.id (restrict - 결제 기록 보존)
     *  eg: "user_xyz789..."
     */
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),

    /** 지갑 ID
     *  크레딧이 적립될 지갑
     *  FK: CreditWalletTable.id (restrict - 결제 기록 보존)
     *  eg: "wallet_def456..."
     */
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => CreditWalletTable.id, { onDelete: "restrict" }),

    /** 결제 타입
     *  구독 결제 vs 크레딧 구매 구분
     *  eg: "subscription", "credit_purchase"
     */
    type: InvoiceTypeEnum("type").notNull().default("credit_purchase"),

    /** 인보이스 제목
     *  eg: "Pro Plan 월간 구독", "Credit Pack 10,000"
     */
    title: text("title").notNull(),

    /** 청구 금액 (원 기준)
     *  eg: "100000.00원"
     */
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),

    /** 구매 크레딧
     *  결제 완료 시 지갑에 적립되는 크레딧
     *  구독: 월간 할당량, 구매: 패키지 크레딧
     *  eg: "10000.00", "1000.00"
     */
    purchasedCredits: decimal("purchased_credits", {
      precision: 15,
      scale: 2,
    }).notNull(),

    /** 결제 상태
     *  pending → paid (성공) / failed (실패)
     *  eg: "pending", "paid", "failed"
     */
    status: InvoiceStatusEnum("status").notNull().default("pending"),

    /** 외부 결제 참조 ID
     *  PG사 거래 ID (웹훅 매칭용)
     *  eg: "kakaopay_tid_abc", "tosspay_orderId_xyz"
     */
    externalRef: text("external_ref"),

    /** 외부 주문 ID
     *  PG사 주문 번호
     *  eg: "partner_order_id_20251014_001"
     */
    externalOrderId: text("external_order_id"),

    /** 생성 시각 */
    createdAt: timestamp("created_at").notNull().defaultNow(),

    /** 결제 완료 시각
     *  paid 상태일 때만 기록
     *  eg: 2025-10-14T12:34:56Z
     */
    paidAt: timestamp("paid_at"),
  },
  (t) => [
    /** 사용자별 결제 내역 조회 */
    index("invoices_user_created_idx").on(t.userId),
    /** PG사 웹훅 처리 시 빠른 조회 */
    index("invoices_external_ref_idx").on(t.externalRef),
  ],
);

/**
 * 구독 플랜 테이블
 *
 * 목적: 구독 플랜별 가격 및 크레딧 정책 정의
 * 캐싱: 1시간 TTL (변경 거의 없음)
 *
 * 플랜 구조:
 * - Free: $0/월, 1K 크레딧, 50 자동충전/6시간, 최대 10회/월
 * - Pro: $100/월, 10K 크레딧, 500 자동충전/6시간, 최대 20회/월
 * - Business: $500/월, 100K 크레딧, 5K 자동충전/6시간, 최대 50회/월
 *
 * 자동 충전 메커니즘:
 * - 잔액 소진 시 refillIntervalHours마다 refillAmount 충전
 * - 한 달에 maxRefillCount회까지만 자동 충전
 * - 매월 1일 또는 구독 갱신일에 충전 횟수 리셋
 *
 */
export const SubscriptionPlansTable = solvesSchema.table("subscription_plans", {
  /** 고유 ID
   *  eg: "plan_abc123..."
   */
  id: uuid("id").primaryKey().defaultRandom(),

  /** 플랜 식별자
   *  시스템 내부 키 (unique)
   *  eg: "free", "pro", "business"
   */
  name: text("name").notNull().unique(),

  /** 플랜 표시명
   *  사용자에게 보이는 이름
   *  eg: "Free Plan", "Pro Plan", "Business Plan"
   */
  displayName: text("display_name").notNull(),

  /** 플랜 설명
   *  간단한 플랜 소개 (1-2문장)
   *  eg: "개인 개발자를 위한 무료 플랜"
   */
  description: text("description"),

  /** 플랜 상세 내용
   *  JSON 배열 형태의 구조화된 컨텐츠
   *  [{type: 'text', text: '월 1,000 크레딧'}, {type: 'text', text: '기본 모델 사용'}]
   */
  plans: jsonb("plans").$type<PlanContentBlock[]>(),

  /** 월 구독료 원 단위 (소수점 2자리)
   *  eg: "0.00", "1000000.00"
   */
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),

  /** 월간 크레딧 할당량
   *  매월 초 또는 구독 갱신일에 지급
   *  eg: "1000.00" (1K), "10000.00" (10K)
   */
  monthlyQuota: decimal("monthly_quota", {
    precision: 15,
    scale: 2,
  }).notNull(),

  /** 정기 자동 충전량
   *  잔액 소진 시 자동 충전되는 크레딧
   *  eg: "50.00", "500.00"
   */
  refillAmount: decimal("refill_amount", {
    precision: 15,
    scale: 2,
  }).notNull(),

  /** 자동 충전 간격 (시간)
   *  마지막 충전 후 대기 시간
   *  eg: 6 (6시간), 12 (12시간), 24 (24시간)
   */
  refillIntervalHours: integer("refill_interval_hours").notNull(),

  /** 월간 최대 자동 충전 횟수
   *  한 달에 자동 충전 가능한 최대 횟수
   *  매월 1일에 리셋 (또는 구독 갱신일)
   *  예측 가능한 비용: maxRefillCount × refillAmount
   *  eg: 10 (Free), 20 (Pro), 50 (Business)
   */
  maxRefillCount: integer("max_refill_count").notNull(),

  /** 플랜 활성화 여부
   *  비활성 플랜은 신규 구독 불가
   *  eg: true, false
   */
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

/**
 * 구독 테이블
 *
 * 목적: 사용자-플랜 관계 + 현재 상태 관리
 * 캐싱: 5분 TTL (빠른 조회 필요)
 *
 * 설계 철학:
 * - 구독 시작 시 1번 생성
 * - 상태/플랜 변경 시 UPDATE
 * - 삭제 안 함 (soft delete - status='expired')
 *
 * 구독 상태:
 * - active: 활성 구독 (정상 사용 중)
 * - past_due: 결제 실패 (재시도 중)
 * - canceled: 취소됨 (현재 기간까지 사용 가능)
 * - expired: 만료됨 (서비스 중단)
 *
 * 지갑 통합:
 * - 구독 크레딧 + 추가 구매 크레딧 모두 1개 지갑 사용
 * - 기존 CreditWallet 시스템과 완전 호환
 */
export const SubscriptionStatusEnum = solvesSchema.enum("subscription_status", [
  "active",
  "past_due",
  "canceled",
  "expired",
]);

export const SubscriptionsTable = solvesSchema.table(
  "subscriptions",
  {
    /** 고유 ID
     *  eg: "sub_abc123..."
     */
    id: uuid("id").primaryKey().defaultRandom(),

    /** 사용자 ID
     *  FK: userTable.id (cascade delete - 사용자 삭제 시 구독도 삭제)
     *  eg: "user_xyz789..."
     */
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    /** 현재 플랜 ID
     *  플랜 변경 시 UPDATE
     *  FK: SubscriptionPlansTable.id (restrict - 플랜 보존)
     *  eg: "plan_pro_001"
     */
    planId: uuid("plan_id")
      .notNull()
      .references(() => SubscriptionPlansTable.id, { onDelete: "restrict" }),

    /** 지갑 ID
     *  구독 크레딧 + 구매 크레딧 모두 저장 (통합)
     *  FK: CreditWalletTable.id (restrict - 지갑 보존)
     *  eg: "wallet_def456..."
     */
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => CreditWalletTable.id, { onDelete: "restrict" }),

    /** 구독 상태
     *  eg: "active", "past_due", "canceled", "expired"
     */
    status: SubscriptionStatusEnum("status").notNull().default("active"),

    /** 구독 시작일 (불변)
     *  최초 구독 시작 시각
     *  eg: 2025-10-14T00:00:00Z
     */
    startedAt: timestamp("started_at").notNull().defaultNow(),

    /** 현재 구독 기간 시작일
     *  월간 갱신 시 업데이트
     *  eg: 2025-10-01T00:00:00Z
     */
    currentPeriodStart: timestamp("current_period_start").notNull(),

    /** 현재 구독 기간 종료일
     *  이 날짜 이후 자동 갱신 또는 만료
     *  eg: 2025-11-01T00:00:00Z
     */
    currentPeriodEnd: timestamp("current_period_end").notNull(),

    /** 구독 취소 시각
     *  null: 활성 구독
     *  값: 취소됨 (기간까지는 사용 가능)
     *  eg: 2025-10-14T15:30:00Z
     */
    canceledAt: timestamp("canceled_at"),

    /** 구독 만료 시각
     *  status='expired'로 변경된 시각
     *  eg: 2025-11-01T00:00:00Z
     */
    expiredAt: timestamp("expired_at"),

    ...timestamps,
  },
  (t) => [
    /** 사용자당 1개의 구독만 허용 */
    uniqueIndex("subscriptions_user_idx").on(t.userId),

    /** 상태별 조회 최적화 */
    index("subscriptions_status_idx").on(t.status),

    /** 만료 체크용 (Cron Job) */
    index("subscriptions_period_end_idx").on(t.currentPeriodEnd, t.status),
  ],
);

/**
 * 구독 청구 기간 테이블
 *
 * 목적: 각 청구 기간의 상세 정보 및 히스토리 추적
 *
 * 설계 철학:
 * - 매월 1개 row INSERT (불변)
 * - 구독의 시계열 데이터
 * - 리포팅, 히스토리 조회, 감사 추적용
 *
 * 생명주기:
 * 1. 구독 시작/갱신 → INSERT (status='active')
 * 2. 기간 종료 → UPDATE (status='completed')
 * 3. 결제 실패 → UPDATE (status='failed')
 *
 * 활용:
 * - 사용자: 월별 사용 내역 확인
 * - 리포팅: 월별 매출, 이탈율, 사용량
 * - 디버깅: 크레딧 지급/차감 추적
 */
export const SubscriptionPeriodStatusEnum = solvesSchema.enum(
  "subscription_period_status",
  ["active", "completed", "failed", "refunded"],
);

export const SubscriptionPeriodsTable = solvesSchema.table(
  "subscription_periods",
  {
    /** 고유 ID
     *  eg: "period_xyz123..."
     */
    id: uuid("id").primaryKey().defaultRandom(),

    /** 이 기간의 플랜 ID
     *  플랜 변경 추적용
     *  FK: SubscriptionPlansTable.id (restrict)
     *  eg: "plan_pro_001"
     */
    planId: uuid("plan_id").notNull(),

    /** 기간 시작일 (불변)
     *  eg: 2025-10-01T00:00:00Z
     */
    periodStart: timestamp("period_start").notNull(),

    /** 구독 ID
     *  FK: SubscriptionsTable.id (cascade delete)
     *  eg: "sub_abc123..."
     */
    subscriptionId: uuid("subscription_id").notNull(),

    /** 기간 종료일 (불변)
     *  eg: 2025-11-01T00:00:00Z
     */
    periodEnd: timestamp("period_end").notNull(),

    /** 기간 상태
     *  eg: "active", "completed", "failed", "refunded"
     */
    status: SubscriptionPeriodStatusEnum("status").notNull().default("active"),

    /** 기간 타입
     *  initial: 첫 구독
     *  renewal: 월간 갱신
     *  trial: 무료 체험
     *  eg: "renewal"
     */
    periodType: text("period_type").notNull().default("renewal"),

    /** 이 기간에 지급된 크레딧
     *  월간 할당량
     *  eg: "10000.00"
     */
    creditsGranted: decimal("credits_granted", {
      precision: 15,
      scale: 2,
    }),

    /** 이 기간 동안 자동 충전 횟수
     *  maxRefillCount 추적용
     *  eg: 0, 5, 10
     */
    refillCount: integer("refill_count").notNull().default(0),

    /** 마지막 자동 충전 시각
     *  이 기간 내에서만 유효
     *  eg: 2025-10-14T12:00:00Z
     */
    lastRefillAt: timestamp("last_refill_at"),

    /** 결제 정보 */
    invoiceId: uuid("invoice_id").references(() => InvoicesTable.id, {
      onDelete: "restrict",
    }),

    /** 결제 금액 (원, 소수점 2자리)
     *  eg: "10000.00"
     */
    amountPaid: decimal("amount_paid", { precision: 15, scale: 2 }),

    /** 생성 시각 (불변) */
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    /** 구독별 기간 조회 (시간 역순) */
    index("subscription_periods_sub_idx").on(t.subscriptionId, t.periodStart),
    /** 상태별 조회 (Cron Job용) */
    index("subscription_periods_status_idx").on(t.status, t.periodEnd),
    /** 리포팅용 (월별 집계) */
    index("subscription_periods_date_idx").on(t.periodStart),
  ],
);
