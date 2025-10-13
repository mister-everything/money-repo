import type { Cache } from "./interface";
import { MemoryCache } from "./memory-cache";
import { RedisCache } from "./redis-cache";

export interface CreateCacheOptions {
  /**
   * Redis URL (optional)
   * If not provided, will use REDIS_URL from environment
   * If neither is set, will fall back to MemoryCache
   */
  redisUrl?: string;

  /**
   * Force use of MemoryCache even if Redis URL is available
   * Useful for testing
   */
  forceMemory?: boolean;

  /**
   * Key prefix for Redis keys
   */
  keyPrefix?: string;
}

/**
 * Create a cache instance based on environment
 *
 * @example
 * ```typescript
 * // Auto-detect from REDIS_URL env var
 * const cache = createCache();
 *
 * // Force Redis with specific URL
 * const cache = createCache({ redisUrl: "redis://localhost:6379" });
 *
 * // Force MemoryCache for testing
 * const cache = createCache({ forceMemory: true });
 * ```
 */
export function createCache(options: CreateCacheOptions = {}): Cache {
  // Force memory cache if requested
  if (options.forceMemory) {
    console.log("[Cache] Using MemoryCache (forced)");
    return new MemoryCache();
  }

  // Check for Redis URL
  const redisUrl = options.redisUrl || process.env.REDIS_URL;

  if (redisUrl) {
    console.log("[Cache] Using RedisCache");
    return new RedisCache({
      url: redisUrl,
      keyPrefix: options.keyPrefix,
    });
  }

  // Fall back to MemoryCache
  console.log("[Cache] Using MemoryCache (no REDIS_URL found)");
  return new MemoryCache();
}
