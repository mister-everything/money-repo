import { Cache, MemoryCache, RedisCache } from "@workspace/cache";
import { IS_PROD } from "@workspace/util/const";

declare global {
  // eslint-disable-next-line no-var
  var __server__cache__: Cache | undefined;
}

export function createCache(): Cache {
  // Force memory cache if requested
  if (!IS_PROD) {
    console.log("[Cache] Using MemoryCache (forced)");
    return new MemoryCache();
  }

  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    console.log("[Cache] Using RedisCache");
    return new RedisCache({
      url: redisUrl,
      keyPrefix: "solves:",
    });
  }

  // Fall back to MemoryCache
  console.log("[Cache] Using MemoryCache (no REDIS_URL found)");
  return new MemoryCache();
}

const cacheInstance = globalThis.__server__cache__ || createCache();

// Production 환경에서 Redis 필수 검증
if (IS_PROD && cacheInstance.constructor.name === "MemoryCache") {
  throw new Error(
    "[Payment/SharedCache] CRITICAL: 프로덕션에서 cache redis 는 필수 입니다.",
  );
}

if (!IS_PROD) {
  globalThis.__server__cache__ = cacheInstance;
}

export const sharedCache = cacheInstance;

// alias for cache
export const serverState = cacheInstance;
