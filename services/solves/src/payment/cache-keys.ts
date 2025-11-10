/**
 * 캐시 키 네이밍 규칙
 * 일관된 키 네이밍으로 관리 용이성 향상 (Redis/MemoryCache 공통)
 */
export const CacheKeys = {
  /**
   * 사용자 잔액 캐시 (userId 기반)
   * @param userId - 사용자 ID
   * @returns Redis key: user:{userId}:wallet
   */
  userWallet: (userId: string) => `user:${userId}:wallet`,

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
} as const;

/**
 * TTL 설정 (초 단위)
 * 캐시의 유효 기간을 정의
 */
export const CacheTTL = {
  /** 사용자 잔액 캐시 - 10분 */
  USER_WALLET: 600,

  /** AI 가격표 캐시 - 1시간 (가격이 자주 변경되지 않음) */
  AI_PRICE: 3600,

  /** 멱등성 키 - 10분 */
  IDEMPOTENCY: 600,
} as const;
