import { z } from "zod";

/**
 * AI 제공자 가격 정보
 * 모든 가격은 USD per token 단위
 */
export interface AIPrice {
  id: string;
  provider: string;
  model: string;
  displayName: string; // 사용자에게 보이는 모델명
  modelType: string;
  inputTokenPrice: string; // USD per token (예: "0.00000250")
  outputTokenPrice: string; // USD per token (예: "0.00001000")
  cachedTokenPrice: string; // USD per token (캐싱 할인가)
  markupRate: string;
  isActive: boolean;
}

/**
 * 지갑 정보
 * balance는 USD 단위
 */
export interface Wallet {
  id: string;
  userId: string;
  balance: string; // USD (예: "1250.50000000")
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 사용 이벤트
 * billableCredits는 USD
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
  billableCredits: string; // USD
  vendorCost: string | null; // USD
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
export enum TxnKind {
  purchase = "purchase",
  grant = "grant",
  debit = "debit",
  refund = "refund",
  adjustment = "adjustment",
  subscription_grant = "subscription_grant",
  subscription_refill = "subscription_refill",
  subscription_reset = "subscription_reset",
}

/**
 * 크레딧 원장
 * 모든 금액은 USD
 */
export interface CreditLedger {
  id: string;
  walletId: string;
  kind: TxnKind;
  delta: string; // USD
  runningBalance: string; // USD
  reason: string | null;
  idempotencyKey: string;
  createdAt: Date;
}

/**
 * 인보이스 상태
 */
export type InvoiceStatus = "pending" | "paid" | "failed";

/**
 * 인보이스
 * amount는 KRW, purchasedCredits는 USD
 */
export interface Invoice {
  id: string;
  userId: string;
  walletId: string;
  title: string;
  amount: string; // KRW (원화 결제)
  purchasedCredits: string; // USD (지급 크레딧)
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
  displayName: z.string(),
  modelType: z.enum(["text", "image", "audio", "video", "embedding"]),
  inputTokenPrice: z.string().refine((val) => Number(val) >= 0, {
    message: "입력 토큰 가격은 0 이상이어야 합니다",
  }),
  outputTokenPrice: z.string().refine((val) => Number(val) >= 0, {
    message: "출력 토큰 가격은 0 이상이어야 합니다",
  }),
  cachedTokenPrice: z.string().refine((val) => Number(val) >= 0, {
    message: "캐시 토큰 가격은 0 이상이어야 합니다",
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
 * AI 제공자 가격 업데이트 스키마
 */
export const updateAIPriceSchema = createAIPriceSchema.partial();

export type UpdateAIPrice = z.infer<typeof updateAIPriceSchema>;

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
 * price는 KRW, 크레딧은 USD
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  plans: PlanContentBlock[] | null;
  price: string; // KRW (원화 구독료)
  monthlyQuota: string; // USD (월간 크레딧)
  refillAmount: string; // USD (자동 충전 금액)
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
 * creditsGranted는 USD, amountPaid는 KRW
 */
export interface SubscriptionPeriod {
  id: string;
  subscriptionId: string;
  planId: string;
  periodStart: Date;
  periodEnd: Date;
  status: SubscriptionPeriodStatus;
  periodType: string;
  creditsGranted: string | null; // USD
  refillCount: number;
  lastRefillAt: Date | null;
  invoiceId: string | null;
  amountPaid: string | null; // KRW
  metadata: string | null;
  createdAt: Date;
}

/**
 * 구독 정기 충전 이력
 * 모든 금액은 USD
 */
export interface SubscriptionRefill {
  id: string;
  subscriptionId: string;
  walletId: string;
  refillAmount: string; // USD
  balanceBefore: string; // USD
  balanceAfter: string; // USD
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
 * initialCredits는 USD
 */
export interface CreateSubscriptionResponse {
  success: true;
  subscriptionId: string;
  walletId: string;
  initialCredits: string; // USD
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
 * 모든 금액은 USD
 */
export interface RenewSubscriptionResponse {
  success: true;
  newPeriodStart: Date;
  newPeriodEnd: Date;
  creditsGranted: string; // USD
  newBalance: string; // USD
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
 * 모든 금액은 USD
 */
export interface CheckRefillResponse {
  refilled: boolean;
  refillAmount?: string; // USD
  newBalance?: string; // USD
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
  name: z.string("필수 입력 항목 입니다."),
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
