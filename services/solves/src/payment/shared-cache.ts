import { createCache } from "@workspace/cache";
import { IS_PROD } from "@workspace/util/const";

const cacheInstance = createCache({
  forceMemory: !IS_PROD, // dev only
});

// Production 환경에서 Redis 필수 검증
if (IS_PROD && cacheInstance.constructor.name === "MemoryCache") {
  throw new Error(
    "[Payment/SharedCache] CRITICAL: 프로덕션에서 cache redis 는 필수 입니다.",
  );
}

export const sharedCache = cacheInstance;
