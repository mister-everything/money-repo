import { createCache } from "@workspace/cache";

const isProduction = process.env.NODE_ENV === "production";
const cacheInstance = createCache({
  forceMemory: process.env.FORCE_MEMORY_CACHE === "true",
});

// Production 환경에서 Redis 필수 검증
if (isProduction && cacheInstance.constructor.name === "MemoryCache") {
  throw new Error(
    "[Payment/SharedCache] CRITICAL: Redis is REQUIRED in production.\n" +
      "MemoryCache does not work in multi-instance serverless environments.\n" +
      "Please set REDIS_URL environment variable.",
  );
}

export const sharedCache = cacheInstance;
