import { randomBytes } from "crypto";
import { cache } from "./cache";
import type { AIPrice } from "./types";

/**
 * 멱등성 키 생성 유틸리티
 * 구독 시스템에서 사용하는 멱등성 키 생성
 */
export const IdempotencyKeys = {
  /**
   * 구독 리필용 멱등성 키 생성
   * @param subscriptionId - 구독 ID
   * @param periodStart - 기간 시작일
   * @param refillCount - 리필 횟수
   * @returns refill:{subscriptionId}:{periodStart}:{refillCount}
   */
  forRefill: (
    subscriptionId: string,
    periodStart: Date,
    refillCount: number,
  ): string => {
    const periodKey = periodStart.toISOString().split("T")[0];
    return `refill:${subscriptionId}:${periodKey}:${refillCount}`;
  },

  /**
   * 구독 월간 크레딧 지급용 멱등성 키 생성
   * @param subscriptionId - 구독 ID
   * @param periodStart - 기간 시작일
   * @returns grant:{subscriptionId}:{periodStart}
   */
  forGrant: (subscriptionId: string, periodStart: Date): string => {
    const periodKey = periodStart.toISOString().split("T")[0];
    return `grant:${subscriptionId}:${periodKey}`;
  },
};

/**
 * 분산 락 헬퍼
 * Redis 기반 락 획득/해제 (중복 작업 방지)
 */
export class DistributedLock {
  private lockKey: string;
  private ttl: number;
  private lockValue: string;

  constructor(lockKey: string, ttl: number = 60) {
    this.lockKey = lockKey;
    this.ttl = ttl;
    this.lockValue = randomBytes(16).toString("hex");
  }

  /**
   * 락 획득 시도
   * @returns 획득 성공 여부
   */
  async acquire(): Promise<boolean> {
    const existing = await cache.get(this.lockKey);
    if (existing) {
      return false; // 이미 락이 있음
    }

    await cache.setex(this.lockKey, this.ttl, this.lockValue);
    return true;
  }

  /**
   * 락 해제
   * 자신이 획득한 락만 해제 가능
   */
  async release(): Promise<void> {
    const existing = await cache.get(this.lockKey);
    if (existing === this.lockValue) {
      await cache.del(this.lockKey);
    }
  }
}

/**
 * 가격 계산 유틸리티
 */
export const PriceCalculator = {
  /**
   * AI 사용량을 USD 원가로 계산
   * @param price - AI 가격 정보
   * @param tokens - 토큰 사용량
   * @returns USD 원가
   */
  calculateVendorCost: (
    price: AIPrice,
    tokens: {
      input: number;
      output: number;
      cached?: number;
    },
  ): number => {
    const inputCost =
      (tokens.input / 1_000_000) * Number(price.inputTokenPrice);
    const outputCost =
      (tokens.output / 1_000_000) * Number(price.outputTokenPrice);
    const cachedCost =
      ((tokens.cached || 0) / 1_000_000) * Number(price.cachedTokenPrice);

    return inputCost + outputCost + cachedCost;
  },

  /**
   * 원가를 청구 크레딧으로 변환 (마진 적용)
   * @param vendorCostUsd - USD 원가
   * @param markupRate - 마진율
   * @returns 청구 크레딧
   */
  calculateBillableCredits: (
    vendorCostUsd: number,
    markupRate: string,
  ): number => {
    return vendorCostUsd * Number(markupRate);
  },

  /**
   * AI 사용량을 청구 크레딧으로 직접 계산
   * @param price - AI 가격 정보
   * @param tokens - 토큰 사용량
   * @returns 청구 크레딧
   */
  calculateCreditsFromTokens: (
    price: AIPrice,
    tokens: {
      input: number;
      output: number;
      cached?: number;
    },
  ): { vendorCostUsd: number; billableCredits: number } => {
    const vendorCostUsd = PriceCalculator.calculateVendorCost(price, tokens);
    const billableCredits = PriceCalculator.calculateBillableCredits(
      vendorCostUsd,
      price.markupRate,
    );

    return {
      vendorCostUsd,
      billableCredits,
    };
  },
};

/**
 * 숫자를 고정 소수점 문자열로 변환
 * @param value - 숫자
 * @param scale - 소수점 자리수 (기본 6)
 * @returns 문자열 (예: "123.456789")
 */
export const toDecimal = (value: number, scale: number = 6): string => {
  return value.toFixed(scale);
};
