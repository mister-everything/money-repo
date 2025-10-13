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
  markupRate: string;
  isActive: boolean;
}

/**
 * 크레딧 차감 파라미터 스키마
 */
export const deductCreditSchema = z.object({
  walletId: z.string().uuid(),
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
  walletId: z.string().uuid(),
  userId: z.string(),
  creditAmount: z.number().positive(),
  invoiceId: z.string().uuid(),
  idempotencyKey: z.string(),
});

export type CreditPurchaseParams = z.infer<typeof creditPurchaseSchema>;

/**
 * 크레딧 차감 응답
 */
export interface DeductCreditResponse {
  success: true;
  usageId: string;
  autoRefilled?: boolean; // 자동 충전 여부
  refillAmount?: string; // 충전된 금액
  remainingBalance?: string; // 남은 잔액 (optional)
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
  walletId: string;
  priceId: string;
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedTokens: number | null;
  calls: number | null;
  vendorCostUsd: string;
  billableCredits: string;
  idempotencyKey: string | null;
  createdAt: Date;
}

/**
 * 원장 트랜잭션 종류
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
  amountUsd: string;
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
  inputTokenPrice: z.string(),
  outputTokenPrice: z.string(),
  markupRate: z.string().default("1.60"),
  isActive: z.boolean().default(true),
});

export type CreateAIPrice = z.infer<typeof createAIPriceSchema>;

/**
 * 인보이스 생성 스키마
 */
export const createInvoiceSchema = z.object({
  userId: z.string(),
  walletId: z.string().uuid(),
  title: z.string(),
  amountUsd: z.string(),
  purchasedCredits: z.string(),
  externalRef: z.string().optional(),
  externalOrderId: z.string().optional(),
});

export type CreateInvoice = z.infer<typeof createInvoiceSchema>;

/**
 * 구독 상태
 */
export type SubscriptionStatus = "active" | "canceled" | "expired";

/**
 * 구독 플랜 정보
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  priceUsd: string;
  monthlyQuota: string;
  refillAmount: string;
  refillIntervalHours: number;
  maxRefillBalance: string;
  rolloverEnabled: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 사용자 구독 정보
 */
export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  walletId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  lastRefillAt: Date | null;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
  planId: z.string().uuid(),
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
  subscriptionId: z.string().uuid(),
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
  subscriptionId: z.string().uuid(),
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
 * 구독 플랜 생성 스키마
 */
export const createSubscriptionPlanSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  priceUsd: z.string(),
  monthlyQuota: z.string(),
  refillAmount: z.string(),
  refillIntervalHours: z.number().int().positive(),
  maxRefillBalance: z.string(),
  rolloverEnabled: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type CreateSubscriptionPlan = z.infer<
  typeof createSubscriptionPlanSchema
>;

/**
 * 플랜 업그레이드 파라미터
 */
export const upgradeSubscriptionSchema = z.object({
  userId: z.string(),
  newPlanId: z.string().uuid(),
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
