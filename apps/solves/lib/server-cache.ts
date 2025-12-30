import "server-only";
import { Cache, MemoryCache, RedisCache } from "@workspace/cache";
import { IS_PROD } from "@workspace/util/const";
import { randomBytes } from "crypto";

declare global {
  // eslint-disable-next-line no-var
  var __server__cache__: Cache | undefined;
}

export function createCache(): Cache {
  // Force memory cache if requested
  if (!IS_PROD) {
    return new MemoryCache();
  }

  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    return new RedisCache({
      url: redisUrl,
      keyPrefix: "solves:",
    });
  }

  // Fall back to MemoryCache
  return new MemoryCache();
}

const cacheInstance = globalThis.__server__cache__ || createCache();

// Production 환경에서 Redis 필수 검증
if (IS_PROD && cacheInstance.constructor.name === "MemoryCache") {
  throw new Error(
    "[SharedCache] CRITICAL: 프로덕션에서 cache redis 는 필수 입니다.",
  );
}

if (!IS_PROD) {
  globalThis.__server__cache__ = cacheInstance;
}

export const sharedCache = cacheInstance;

// alias for cache
export const serverState = cacheInstance;
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
