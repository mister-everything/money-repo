import { randomBytes } from "crypto";
import { sharedCache } from "./shared-cache";
import type { AIPrice } from "./types";

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
    const existing = await sharedCache.get(this.lockKey);
    if (existing) {
      return false; // 이미 락이 있음
    }

    await sharedCache.setex(this.lockKey, this.ttl, this.lockValue);
    return true;
  }

  /**
   * 락 해제
   * 자신이 획득한 락만 해제 가능
   */
  async release(): Promise<void> {
    const existing = await sharedCache.get(this.lockKey);
    if (existing === this.lockValue) {
      await sharedCache.del(this.lockKey);
    }
  }
}

export const calculateCost = (
  price: AIPrice,
  useage: {
    input: number;
    output: number;
  },
) => {
  const inputCost = useage.input * Number(price.inputTokenPrice);
  const outputCost = useage.output * Number(price.outputTokenPrice);

  const inputMarketCost = inputCost * Number(price.markupRate);
  const outputMarketCost = outputCost * Number(price.markupRate);
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    inputMarketCost,
    outputMarketCost,
    totalMarketCost: inputMarketCost + outputMarketCost,
  };
};

/**
 * 숫자를 고정 소수점 문자열로 변환
 * @param value - 숫자
 * @param scale - 소수점 자리수 (기본 8)
 * @returns 문자열 (예: "123.45678900")
 */
export const toDecimal = (value: number, scale: number = 8): string => {
  return value.toFixed(scale);
};
