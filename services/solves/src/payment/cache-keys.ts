/**
 * 캐시 키 네이밍 규칙
 * 일관된 키 네이밍으로 관리 용이성 향상 (Redis/MemoryCache 공통)
 */
export const CacheKeys = {
  /**
   * 지갑 잔액 캐시
   * @param walletId - 지갑 UUID
   * @returns Redis key: wallet:{walletId}:balance
   */
  walletBalance: (walletId: string) => `wallet:${walletId}:balance`,

  /**
   * AI 가격표 캐시
   * @param provider - AI 제공자 (openai, gemini, claude, xai)
   * @param model - 모델명 (gpt-4o-mini, claude-3-5-sonnet, etc.)
   * @returns Redis key: price:{provider}:{model}
   */
  aiPrice: (provider: string, model: string) => `price:${provider}:${model}`,

  /**
   * 멱등성 키 (중복 요청 방지)
   * @param key - 멱등성 키
   * @returns Redis key: idemp:{key}
   */
  idempotency: (key: string) => `idemp:${key}`,

  /**
   * 구독 정보 캐시
   * @param userId - 사용자 UUID
   * @returns Redis key: subscription:{userId}
   */
  subscription: (userId: string) => `subscription:${userId}`,

  /**
   * 구독 플랜 캐시
   * @param planId - 플랜 UUID
   * @returns Redis key: plan:{planId}
   */
  subscriptionPlan: (planId: string) => `plan:${planId}`,

  /**
   * 정기 충전 잠금 (중복 충전 방지)
   * @param userId - 사용자 UUID
   * @returns Redis key: refill:lock:{userId}
   */
  refillLock: (userId: string) => `refill:lock:${userId}`,
} as const;

/**
 * TTL 설정 (초 단위)
 * 캐시의 유효 기간을 정의
 */
export const CacheTTL = {
  /** 지갑 잔액 캐시 - 10분 */
  WALLET_BALANCE: 600,

  /** AI 가격표 캐시 - 1시간 (가격이 자주 변경되지 않음) */
  AI_PRICE: 3600,

  /** 멱등성 키 - 10분 */
  IDEMPOTENCY: 600,

  /** 구독 정보 캐시 - 10분 */
  SUBSCRIPTION: 600,

  /** 구독 플랜 캐시 - 1시간 (플랜 정보는 자주 변경되지 않음) */
  SUBSCRIPTION_PLAN: 3600,

  /** 정기 충전 잠금 - 1분 (충전 중복 방지) */
  REFILL_LOCK: 60,
} as const;
