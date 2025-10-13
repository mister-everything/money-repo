import type { Cache } from "./interface";

interface CacheEntry {
  value: string;
  expiresAt: number | null;
}

/**
 * In-memory cache implementation using Map
 * Useful for development, testing, or when Redis is not available
 */
export class MemoryCache implements Cache {
  private cache: Map<string, CacheEntry>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.cache = new Map();
    this.cleanupInterval = null;

    // Run cleanup every 60 seconds to remove expired entries
    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const entries = Array.from(this.cache.entries());
      for (const [key, entry] of entries) {
        if (entry.expiresAt && entry.expiresAt < now) {
          this.cache.delete(key);
        }
      }
    }, 60000); // 60 seconds
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl * 1000 : null;
    this.cache.set(key, { value, expiresAt });
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    await this.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async delMany(keys: string[]): Promise<void> {
    for (const key of keys) {
      this.cache.delete(key);
    }
  }

  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}
