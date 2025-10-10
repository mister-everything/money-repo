/**
 * Cache interface for key-value storage
 * Supports both in-memory and Redis implementations
 */
export interface Cache {
  /**
   * Get a value by key
   * @param key - The cache key
   * @returns The cached value or null if not found
   */
  get(key: string): Promise<string | null>;

  /**
   * Set a value with optional TTL
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Time to live in seconds (optional)
   */
  set(key: string, value: string, ttl?: number): Promise<void>;

  /**
   * Set a value with TTL (Redis SETEX style)
   * @param key - The cache key
   * @param ttl - Time to live in seconds
   * @param value - The value to cache
   */
  setex(key: string, ttl: number, value: string): Promise<void>;

  /**
   * Delete a key from cache
   * @param key - The cache key to delete
   */
  del(key: string): Promise<void>;

  /**
   * Delete multiple keys from cache
   * @param keys - Array of cache keys to delete
   */
  delMany(keys: string[]): Promise<void>;

  /**
   * Close the cache connection (for cleanup)
   */
  close(): Promise<void>;
}
