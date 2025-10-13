import Redis from "ioredis";
import type { Cache } from "./interface";

export interface RedisCacheOptions {
  url?: string;
  keyPrefix?: string;
}

/**
 * Redis cache implementation using ioredis
 * Production-ready cache with persistence and clustering support
 *
 * @example
 * ```typescript
 * // With REDIS_URL env var
 * const cache = new RedisCache();
 *
 * // With explicit URL
 * const cache = new RedisCache({ url: "redis://localhost:6379" });
 * ```
 */
export class RedisCache implements Cache {
  private client: Redis;

  constructor(options: RedisCacheOptions = {}) {
    const redisUrl =
      options.url || process.env.REDIS_URL || "redis://localhost:6379";

    this.client = new Redis(redisUrl, {
      keyPrefix: options.keyPrefix,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on("error", (err) => {
      console.error("[RedisCache] Connection error:", err);
    });

    this.client.on("connect", () => {
      console.log("[RedisCache] Connected to Redis");
    });
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    await this.client.setex(key, ttl, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async delMany(keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async close(): Promise<void> {
    await this.client.quit();
  }

  /**
   * Get the underlying Redis client for advanced operations
   */
  getClient(): Redis {
    return this.client;
  }
}
