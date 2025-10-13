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
export type TxnKind = "purchase" | "grant" | "debit" | "refund" | "adjustment";

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
