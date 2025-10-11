import { userTable } from "@service/auth";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  numeric as decimal,
  index,
  integer,
  pgEnum,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { solvesSchema } from "../prob/schema";

const timestamps = {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date()),
  deletedAt: timestamp("deleted_at"),
};

/* ============================================================
   1) AI Provider 가격 테이블 (모델별 원가/마진/활성화)
   - 목적: 사용 시점의 단가 참조 및 리포팅
   ============================================================ */
export const AiProviderPricesTable = solvesSchema.table(
  "ai_provider_prices",
  {
    /** 고유 ID
     *  eg: 1c0c1b1e-2e0d-4c60-9e2d-0af5a8d9c1aa
     */
    id: uuid("id").primaryKey().defaultRandom(),

    /** AI 제공자 (벤더)
     *  eg: "openai" | "gemini" | "claude" | "xai"
     */
    provider: text("provider").notNull(),

    /** 모델명
     *  eg: "gpt-4o-mini", "claude-3-5-sonnet", "gpt-4.1", "grok-2"
     */
    model: text("model").notNull(),

    /** 모델 타입 - 과금 방식 구분용 */
    modelType: text("model_type").notNull(), // text, image, audio, video, embedding

    /** 입력 토큰 단가(USD) — 1M 토큰 기준
     *  eg: "0.00150000"
     */
    inputTokenPrice: decimal("input_token_price", {
      precision: 12,
      scale: 8,
    }).notNull(),

    /** 출력 토큰 단가(USD) — 1M 토큰 기준
     *  eg: "0.00500000"
     */
    outputTokenPrice: decimal("output_token_price", {
      precision: 12,
      scale: 8,
    }).notNull(),

    /** 마진율(곱) — 청구금액 = 원가 * markupRate
     *  eg: "1.60"  // 60% 마진
     */
    markupRate: decimal("markup_rate", { precision: 6, scale: 3 })
      .notNull()
      .default("1.60"),

    /** 활성화 여부 (비활성 모델은 가격 조회/추천에서 제외)
     *  eg: true
     */
    isActive: boolean("is_active").notNull().default(true),

    /** 생성/수정 시각 */
    ...timestamps,
  },
  (t) => [
    uniqueIndex("ai_provider_prices_provider_model_idx").on(
      t.provider,
      t.model,
    ),
  ],
);

/* ============================================================
   2) 유저별 크레딧 지갑 (Optimistic Locking: version)
   - 목적: 현재 남은 크레딧(O(1) 조회), 낙관적 CAS 업데이트
   ============================================================ */
export const CreditWalletTable = solvesSchema.table(
  "credit_wallet",
  {
    /** 고유 ID */
    id: uuid("id").primaryKey().defaultRandom(),

    /** 지갑 소유자(개인) — FK(User.id)
     *  eg: 3a5b6c7d-8e9f-4011-a1b2-3c4d5e6f7a8b
     */
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    /** 현재 남은 크레딧(캐시) — 금액/크레딧은 decimal로 정밀 보존
     *  eg: "1250.000000"
     */
    balance: decimal("balance", { precision: 18, scale: 6 })
      .notNull()
      .default("0"),

    /** 낙관적 갱신(CAS) 버전
     *  - UPDATE ... WHERE version = :prevVersion 으로 충돌 감지
     *  eg: 0, 1, 2, ...
     */
    version: integer("version").notNull().default(0),

    ...timestamps,
  },
  (t) => [
    /** 사용자당 1 지갑 보장 */
    uniqueIndex("credit_wallet_user_unique").on(t.userId),
    /** 음수 잔액 방지 — 조건부 UPDATE로도 막지만, 방어적으로 체크 추가 */
    check("balance_non_negative", sql`${t.balance} >= 0`),
  ],
);

/* ============================================================
   3) 원장(불변 트랜잭션 로그)
   - 목적: 모든 크레딧 변동에 대한 감사 추적(append-only)
   ============================================================ */
export const TxnKindEnum = pgEnum("credit_txn_kind", [
  "purchase", // 결제 충전 (Invoice 확정)
  "grant", // 이벤트/프로모션/관리자 지급
  "debit", // 사용 차감
  "refund", // 환불(크레딧 복원)
  "adjustment", // 수동 조정(상쇄)
]);

export const CreditLedgerTable = solvesSchema.table(
  "credit_ledger",
  {
    /** 고유 ID */
    id: uuid("id").primaryKey().defaultRandom(),

    /** 어떤 지갑의 트랜잭션인지 — FK(credit_wallet.id) */
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => CreditWalletTable.id, { onDelete: "cascade" }),

    /** 트랜잭션 종류 */
    kind: TxnKindEnum("kind").notNull(),

    /** 증감 크레딧 — +적립 / -차감
     *  eg: "+100.000000" (purchase/grant), "-12.500000" (debit)
     */
    delta: decimal("delta", { precision: 18, scale: 6 }).notNull(),

    /** 적용 직후 지갑 잔액 스냅샷 — 리포팅/복구 용이
     *  eg: "987.500000"
     */
    runningBalance: decimal("running_balance", {
      precision: 18,
      scale: 6,
    }).notNull(),

    /** 멱등키 — 재시도/중복 처리 방지 (지갑 단위로 유니크)
     *  eg: "ue_2025-10-10T12:00:00Z_req123"
     */
    idempotencyKey: text("idempotency_key"),

    /** 출처/사유 — invoice:xxx, promo:SPRING-25, usage:ue_xxx 등
     *  eg: "invoice:inv_20251010_001"
     */
    reason: text("reason"),

    /** 생성 시각 */
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    /** 조회(지갑별 타임라인) 최적화 */
    index("credit_ledger_wallet_created_idx").on(t.walletId, t.createdAt),
    /** (wallet_id, idempotency_key) 중복 방지 — 멱등 보장 */
    uniqueIndex("credit_ledger_wallet_idemp_uniq").on(
      t.walletId,
      t.idempotencyKey,
    ),
  ],
);

/* ============================================================
   4) 사용(원가/청구) 이벤트
   - 목적: 모델/프라이스 기준의 사용 1건 기록(원가·차감 크레딧 보존)
   - 설계: 비정규화 패턴 (성능 + 히스토리 보존)
     * priceId: 가격 스냅샷 참조
     * provider/model: JOIN 없이 빠른 리포팅 쿼리 (GROUP BY)
     * vendorCostUsd: 당시 실제 원가 보존 (가격 변경되어도 히스토리 유지)
   ============================================================ */
export const UsageEventsTable = solvesSchema.table(
  "usage_events",
  {
    /** 고유 ID */
    id: uuid("id").primaryKey().defaultRandom(),

    /** 호출한 사용자 — 팀 지갑을 쓰더라도 "누가 썼는지" 추적 용
     *  eg: user UUID
     */
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),

    /** 차감이 일어난 지갑 — 개인/팀 지갑 모두 가능
     *  eg: wallet UUID
     */
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => CreditWalletTable.id, { onDelete: "restrict" }),

    /** 가격 스냅샷 참조 — 사용 시점의 단가(모델/벤더/마진)
     *  NOTE: priceId가 있지만 provider/model/vendorCostUsd를 중복 저장하는 이유:
     *  1. 성능: JOIN 없이 리포팅 쿼리 가능 (provider, model로 GROUP BY)
     *  2. 히스토리: 가격 변경 시에도 과거 원가 보존
     *  3. 무결성: 구모델 삭제해도 사용 기록 유지
     */
    priceId: uuid("price_id")
      .notNull()
      .references(() => AiProviderPricesTable.id, { onDelete: "restrict" }),
    /** 공급자/모델명 (비정규화)
     *  priceId로 JOIN 가능하지만 리포팅 성능을 위해 중복 저장
     *  eg: provider="openai", model="gpt-4o-mini"
     */
    provider: text("provider").notNull(),
    model: text("model").notNull(),

    /** 토큰/호출량
     *  - inputTokens / outputTokens: 1 토큰 단위(애플리케이션에서 1k단위 환산)
     *  - cachedTokens: 캐시/리유즈로 원가가 발생하지 않은(혹은 할인) 토큰 수
     *  - calls: per-request 과금(이미지, 비전, 오디오, 임베딩 벌크콜 등)
     *  eg: input=3000, output=1200, cached=1000, calls=1
     */
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    cachedTokens: integer("cached_tokens"),
    calls: integer("calls"),

    /** 공급자 원가(USD) — 당시 실제 원가 (히스토리 보존용)
     *  가격이 변경되어도 이 레코드의 원가는 불변
     *  eg: "0.012500"
     */
    vendorCostUsd: decimal("vendor_cost_usd", {
      precision: 18,
      scale: 6,
    }).notNull(),

    /** 고객에게 실제로 차감된 크레딧 — (원가 * markup)
     *  eg: "1.250000"
     */
    billableCredits: decimal("billable_credits", {
      precision: 18,
      scale: 6,
    }).notNull(),

    /** 멱등키(요청ID) — 동일 사용 보고 중복 방지
     *  eg: "req_01J9E1Y9J7ABCDEF"
     */
    idempotencyKey: text("request_id"),

    /** 생성 시각 */
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    /** (지갑 ID, 시간) 인덱스 — 월별/기간별 페이징 리포트에 유용 */
    index("usage_events_wallet_created_idx").on(t.walletId, t.createdAt),

    /** (사용자 ID, 시간) 인덱스 — 개별 사용자 활동 조회 시 유용 */
    index("usage_events_user_created_idx").on(t.userId, t.createdAt),

    /** (wallet_id, idempotencyKey) 유니크 — 멱등 보장 */
    uniqueIndex("usage_events_wallet_idemp_uniq").on(
      t.walletId,
      t.idempotencyKey,
    ),
  ],
);

/* ============================================================
   5) 인보이스(결제) 기록
   - 목적: 결제 단위 기록(확정 시 purchase로 지갑 적립)
   ============================================================ */
export const InvoiceStatusEnum = pgEnum("invoice_status", [
  "pending",
  "paid",
  "failed",
]);

export const InvoicesTable = solvesSchema.table(
  "invoices",
  {
    /** 고유 ID */
    id: uuid("id").primaryKey().defaultRandom(),

    /** 결제자 — 개인/팀 결제에서도 "누가 결제했는지" 추적 */
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),

    /** 적립 대상 지갑 — 개인/팀 지갑 모두 가능 */
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => CreditWalletTable.id, { onDelete: "restrict" }),

    /** 인보이스/패키지 이름
     *  eg: "Credit Pack 1,000"
     */
    title: text("title").notNull(),

    /** 청구 금액(USD)
     *  eg: "19.990000"
     */
    amountUsd: decimal("amount_usd", { precision: 18, scale: 6 }).notNull(),

    /** 구매로 적립된 크레딧
     *  eg: "1000.000000"
     */
    purchasedCredits: decimal("purchased_credits", {
      precision: 18,
      scale: 6,
    }).notNull(),

    /** 상태: pending → paid/failed */
    status: InvoiceStatusEnum("status").notNull().default("pending"),

    /** PG사 결제/세션 ID 등 외부 참조
     *  eg: "kakaopay"
     */
    externalRef: text("external_ref"),
    /** 외부 주문 ID: orderId, partner_order_id 등 */
    externalOrderId: text("external_order_id"),

    /** 생성/결제 시각 */
    createdAt: timestamp("created_at").notNull().defaultNow(),
    paidAt: timestamp("paid_at"),
  },
  (t) => [
    /** 결제 히스토리 조회(사용자/기간 필터) */
    index("invoices_user_created_idx").on(t.userId, t.createdAt),

    /** 외부 결제 참조로 단건 조회 속도 개선 */
    index("invoices_external_ref_idx").on(t.externalRef),
  ],
);

/* ============================================================
   6) 멱등성 키 테이블 (Redis로 대체 가능하지만 DB에도 보관)
   - 목적: Redis 장애 시에도 멱등성 보장
   ============================================================ */
export const IdempotencyKeysTable = solvesSchema.table(
  "idempotency_keys",
  {
    /** 멱등성 키 (Primary Key) */
    key: text("key").primaryKey(),

    /** 요청한 사용자 */
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "set null" }),

    /** 리소스 타입 (usage_event, invoice, etc.) */
    resourceType: text("resource_type").notNull(),

    /** 생성된 리소스 ID */
    resourceId: uuid("resource_id").notNull(),

    /** 응답 내용 (JSON) */
    response: text("response").notNull(),

    /** 생성 시각 */
    createdAt: timestamp("created_at").notNull().defaultNow(),

    /** 만료 시각 (자동 정리용) */
    expiresAt: timestamp("expires_at").notNull(),
  },
  (t) => [
    /** 만료된 키 정리를 위한 인덱스 */
    index("idempotency_expires_at_idx").on(t.expiresAt),
  ],
);
