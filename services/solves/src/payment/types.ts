import { z } from "zod";

/**
 * AI 제공자 가격 정보
 */
export interface AIPrice {
  id: string;
  provider: string;
  model: string;
  modelType: string;
  inputTokenPrice: string;
  outputTokenPrice: string;
  cachedTokenPrice: string; // 캐싱된 토큰 가격 추가
  markupRate: string;
  isActive: boolean;
}

/**
 * 크레딧 차감 파라미터 스키마
 */
export const deductCreditSchema = z.object({
  walletId: z.uuid(),
  userId: z.string(),
  provider: z.string(),
  model: z.string(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  cachedTokens: z.number().int().nonnegative().optional(),
  calls: z.number().int().nonnegative().optional(),
  idempotencyKey: z.string(),
});

export type DeductCreditParams = z.infer<typeof deductCreditSchema>;

/**
 * 크레딧 충전 파라미터 스키마
 */
export const creditPurchaseSchema = z.object({
  walletId: z.uuid(),
  userId: z.string(),
  creditAmount: z.number().positive(),
  invoiceId: z.uuid(),
  idempotencyKey: z.string(),
});

export type CreditPurchaseParams = z.infer<typeof creditPurchaseSchema>;

/**
 * 크레딧 차감 응답 (백그라운드)
 */
export interface DeductCreditAsyncResponse {
  success: true;
  estimatedBalance: string;
  jobId?: string; // 백그라운드 작업 ID (optional)
}

/**
 * 크레딧 차감 응답 (동기)
 */
export interface DeductCreditResponse {
  success: true;
  usageId: string;
  newBalance: string;
  autoRefilled?: boolean; // 자동 충전 여부
  refillAmount?: string; // 충전된 금액
}

/**
 * 크레딧 부족 에러 상세 정보
 */
export interface InsufficientCreditsError {
  code: "INSUFFICIENT_CREDITS";
  message: string;
  currentBalance: string;
  required: string;
  nextRefillAt?: Date; // 다음 자동 충전 시각
  nextRefillAmount?: string; // 다음 충전 금액
  waitTimeMinutes?: number; // 대기 시간 (분)
  hasSubscription: boolean;
  suggestions: Array<{
    type: "wait" | "subscribe" | "purchase";
    message: string;
  }>;
}

/**
 * 크레딧 충전 응답
 */
export interface CreditPurchaseResponse {
  success: true;
  newBalance: number;
}

/**
 * 지갑 정보
 */
export interface Wallet {
  id: string;
  userId: string;
  balance: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 사용 이벤트
 */
export interface UsageEvent {
  id: string;
  userId: string;
  priceId: string;
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedTokens: number | null;
  calls: number | null;
  billableCredits: string;
  idempotencyKey: string | null;
  createdAt: Date;
}

/**
 * 원장 트랜잭션 종류
 * 트랜잭션 종류 (kind):
 * - "purchase": 결제 충전 (Invoice 확정)
 * - "grant": 이벤트/프로모션/관리자 지급
 * - "debit": AI 사용 차감
 * - "refund": 환불 (크레딧 복원)
 * - "adjustment": 수동 조정
 * - "subscription_grant": 구독 시작/갱신 시 크레딧 지급
 * - "subscription_refill": 정기 자동 충전
 * - "subscription_reset": 월간 갱신 시 잔액 리셋 (rollover=false)
 */
export type TxnKind =
  | "purchase"
  | "grant"
  | "debit"
  | "refund"
  | "adjustment"
  | "subscription_grant"
  | "subscription_refill"
  | "subscription_reset";

/**
 * 크레딧 원장
 */
export interface CreditLedger {
  id: string;
  walletId: string;
  kind: TxnKind;
  delta: string;
  runningBalance: string;
  idempotencyKey: string | null;
  reason: string | null;
  createdAt: Date;
}

/**
 * 인보이스 상태
 */
export type InvoiceStatus = "pending" | "paid" | "failed";

/**
 * 인보이스
 */
export interface Invoice {
  id: string;
  userId: string;
  walletId: string;
  title: string;
  amount: string;
  purchasedCredits: string;
  status: InvoiceStatus;
  externalRef: string | null;
  externalOrderId: string | null;
  createdAt: Date;
  paidAt: Date | null;
}

/**
 * AI 제공자 가격 생성 스키마
 */
export const createAIPriceSchema = z.object({
  provider: z.string(),
  model: z.string(),
  modelType: z.enum(["text", "image", "audio", "video", "embedding"]),
  inputTokenPrice: z.string().refine((val) => Number(val) >= 0, {
    message: "입력 토큰 가격은 0 이상이어야 합니다",
  }),
  outputTokenPrice: z.string().refine((val) => Number(val) >= 0, {
    message: "출력 토큰 가격은 0 이상이어야 합니다",
  }),
  markupRate: z
    .string()
    .refine((val) => Number(val) > 0, {
      message: "마진율은 0보다 커야 합니다",
    })
    .default("1.60"),
  isActive: z.boolean().default(true),
});

export type CreateAIPrice = z.infer<typeof createAIPriceSchema>;

/**
 * 인보이스 생성 스키마
 */
export const createInvoiceSchema = z.object({
  userId: z.string(),
  walletId: z.uuid(),
  title: z.string(),
  amount: z.string().refine((val) => Number(val) >= 0, {
    message: "금액은 0 이상이어야 합니다",
  }),
  purchasedCredits: z.string().refine((val) => Number(val) >= 0, {
    message: "구매 크레딧은 0 이상이어야 합니다",
  }),
  externalRef: z.string().optional(),
  externalOrderId: z.string().optional(),
});

export type CreateInvoice = z.infer<typeof createInvoiceSchema>;

/**
 * 구독 상태
 */
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "expired";

/**
 * 구독 기간 상태
 */
export type SubscriptionPeriodStatus =
  | "active"
  | "completed"
  | "failed"
  | "refunded";

/**
 * 구독 플랜 정보
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  plans: PlanContentBlock[] | null;
  price: string;
  monthlyQuota: string;
  refillAmount: string;
  refillIntervalHours: number;
  maxRefillCount: number; // maxRefillBalance → maxRefillCount 변경
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 이용자수 포함 구독 플랜 정보
 */

export interface SubscriptionPlanWithCount extends SubscriptionPlan {
  count: number;
}

/**
 * 구독 기간 정보
 */
export interface SubscriptionPeriod {
  id: string;
  subscriptionId: string;
  planId: string;
  periodStart: Date;
  periodEnd: Date;
  status: SubscriptionPeriodStatus;
  periodType: string;
  creditsGranted: string | null;
  refillCount: number;
  lastRefillAt: Date | null;
  invoiceId: string | null;
  amountPaid: string | null;
  metadata: string | null;
  createdAt: Date;
}

/**
 * 구독 정기 충전 이력
 */
export interface SubscriptionRefill {
  id: string;
  subscriptionId: string;
  walletId: string;
  refillAmount: string;
  balanceBefore: string;
  balanceAfter: string;
  createdAt: Date;
}

/**
 * 구독 생성 파라미터 스키마
 */
export const createSubscriptionSchema = z.object({
  userId: z.string(),
  planId: z.uuid(),
});

export type CreateSubscriptionParams = z.infer<typeof createSubscriptionSchema>;

/**
 * 구독 생성 응답
 */
export interface CreateSubscriptionResponse {
  success: true;
  subscriptionId: string;
  walletId: string;
  initialCredits: string;
}

/**
 * 구독 갱신 파라미터
 */
export const renewSubscriptionSchema = z.object({
  subscriptionId: z.uuid(),
});

export type RenewSubscriptionParams = z.infer<typeof renewSubscriptionSchema>;

/**
 * 구독 갱신 응답
 */
export interface RenewSubscriptionResponse {
  success: true;
  newPeriodStart: Date;
  newPeriodEnd: Date;
  creditsGranted: string;
  newBalance: string;
}

/**
 * 정기 충전 체크 파라미터
 */
export const checkRefillSchema = z.object({
  userId: z.string(),
});

export type CheckRefillParams = z.infer<typeof checkRefillSchema>;

/**
 * 정기 충전 응답
 */
export interface CheckRefillResponse {
  refilled: boolean;
  refillAmount?: string;
  newBalance?: string;
  nextRefillAt?: Date;
}

/**
 * 구독 취소 파라미터
 */
export const cancelSubscriptionSchema = z.object({
  subscriptionId: z.uuid(),
});

export type CancelSubscriptionParams = z.infer<typeof cancelSubscriptionSchema>;

/**
 * 구독 취소 응답
 */
export interface CancelSubscriptionResponse {
  success: true;
  canceledAt: Date;
  validUntil: Date;
}

/**
 * 플랜 컨텐츠 블록 타입
 */
export const planContentBlockSchema = z.union([
  z.object({
    type: z.literal("text"),
    text: z.string(),
  }),
]);

export type PlanContentBlock = z.infer<typeof planContentBlockSchema>;

/**
 * 구독 플랜 생성 스키마
 */
export const createSubscriptionPlanSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  plans: z.array(planContentBlockSchema).optional(),
  price: z.string().refine((val) => Number(val) >= 0, {
    message: "가격은 0 이상이어야 합니다",
  }),
  monthlyQuota: z.string().refine((val) => Number(val) >= 0, {
    message: "월간 할당량은 0 이상이어야 합니다",
  }),
  refillAmount: z.string().refine((val) => Number(val) >= 0, {
    message: "충전량은 0 이상이어야 합니다",
  }),
  refillIntervalHours: z.number().int().positive(),
  maxRefillCount: z.number().int().nonnegative(), // maxRefillBalance → maxRefillCount
  isActive: z.boolean().default(true),
});

export type CreateSubscriptionPlan = z.infer<
  typeof createSubscriptionPlanSchema
>;

/**
 * 구독 플랜 업데이트 스키마
 */
export const updateSubscriptionPlanSchema =
  createSubscriptionPlanSchema.partial();

export type UpdateSubscriptionPlan = z.infer<
  typeof updateSubscriptionPlanSchema
>;

/**
 * 플랜 업그레이드 파라미터
 */
export const upgradeSubscriptionSchema = z.object({
  userId: z.string(),
  newPlanId: z.uuid(),
});

export type UpgradeSubscriptionParams = z.infer<
  typeof upgradeSubscriptionSchema
>;

/**
 * 플랜 업그레이드 응답
 */
export interface UpgradeSubscriptionResponse {
  success: true;
  subscriptionId: string;
  newPlanId: string;
  creditAdjustment: string; // 양수면 추가, 음수면 차감
  newBalance: string;
}
