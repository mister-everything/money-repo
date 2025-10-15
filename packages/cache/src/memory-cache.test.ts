import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryCache } from "./memory-cache";

describe("MemoryCache", () => {
  let cache: MemoryCache;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new MemoryCache();
  });

  afterEach(async () => {
    await cache.close();
    vi.useRealTimers();
  });

  describe("get/set", () => {
    it("should store and retrieve value", async () => {
      await cache.set("key1", "value1");
      const value = await cache.get("key1");
      expect(value).toBe("value1");
    });

    it("should return null for non-existent key", async () => {
      const value = await cache.get("nonexistent");
      expect(value).toBeNull();
    });

    it("should overwrite existing value", async () => {
      await cache.set("key1", "value1");
      await cache.set("key1", "value2");
      const value = await cache.get("key1");
      expect(value).toBe("value2");
    });
  });

  describe("TTL (Time To Live)", () => {
    it("should set value with TTL", async () => {
      await cache.set("key1", "value1", 10); // 10 seconds
      const value = await cache.get("key1");
      expect(value).toBe("value1");
    });

    it("should expire value after TTL", async () => {
      await cache.set("key1", "value1", 10); // 10 seconds

      // Before expiration
      expect(await cache.get("key1")).toBe("value1");

      // After expiration
      vi.advanceTimersByTime(11000); // 11 seconds
      expect(await cache.get("key1")).toBeNull();
    });

    it("should not expire value without TTL", async () => {
      await cache.set("key1", "value1"); // no TTL

      vi.advanceTimersByTime(100000); // 100 seconds
      expect(await cache.get("key1")).toBe("value1");
    });
  });

  describe("setex", () => {
    it("should set value with TTL using setex", async () => {
      await cache.setex("key1", 10, "value1"); // 10 seconds
      expect(await cache.get("key1")).toBe("value1");
    });

    it("should expire value after TTL using setex", async () => {
      await cache.setex("key1", 5, "value1"); // 5 seconds

      vi.advanceTimersByTime(6000); // 6 seconds
      expect(await cache.get("key1")).toBeNull();
    });
  });

  describe("del", () => {
    it("should delete single key", async () => {
      await cache.set("key1", "value1");
      await cache.set("key2", "value2");

      await cache.del("key1");

      expect(await cache.get("key1")).toBeNull();
      expect(await cache.get("key2")).toBe("value2");
    });

    it("should not throw error when deleting non-existent key", async () => {
      await expect(cache.del("nonexistent")).resolves.toBeUndefined();
    });
  });

  describe("delMany", () => {
    it("should delete multiple keys", async () => {
      await cache.set("key1", "value1");
      await cache.set("key2", "value2");
      await cache.set("key3", "value3");

      await cache.delMany(["key1", "key3"]);

      expect(await cache.get("key1")).toBeNull();
      expect(await cache.get("key2")).toBe("value2");
      expect(await cache.get("key3")).toBeNull();
    });

    it("should handle empty array", async () => {
      await cache.set("key1", "value1");
      await cache.delMany([]);
      expect(await cache.get("key1")).toBe("value1");
    });
  });

  describe("cleanup mechanism", () => {
    it("should automatically clean up expired entries", async () => {
      await cache.set("key1", "value1", 5); // 5 seconds
      await cache.set("key2", "value2", 100); // 100 seconds
      await cache.set("key3", "value3"); // no TTL

      // Before cleanup
      expect(await cache.get("key1")).toBe("value1");

      // Expire key1
      vi.advanceTimersByTime(6000); // 6 seconds

      // Trigger cleanup (runs every 60 seconds)
      vi.advanceTimersByTime(60000); // 60 seconds

      expect(await cache.get("key1")).toBeNull();
      expect(await cache.get("key2")).toBe("value2");
      expect(await cache.get("key3")).toBe("value3");
    });

    it("should clean up multiple expired entries", async () => {
      await cache.set("key1", "value1", 1);
      await cache.set("key2", "value2", 2);
      await cache.set("key3", "value3", 3);

      vi.advanceTimersByTime(4000); // 4 seconds - all expired
      vi.advanceTimersByTime(60000); // trigger cleanup

      expect(await cache.get("key1")).toBeNull();
      expect(await cache.get("key2")).toBeNull();
      expect(await cache.get("key3")).toBeNull();
    });
  });

  describe("close", () => {
    it("should clear all entries and stop cleanup", async () => {
      await cache.set("key1", "value1");
      await cache.set("key2", "value2");

      await cache.close();

      expect(await cache.get("key1")).toBeNull();
      expect(await cache.get("key2")).toBeNull();
    });

    it("should not throw error when closing twice", async () => {
      await cache.close();
      await expect(cache.close()).resolves.toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should handle empty string value", async () => {
      await cache.set("key1", "");
      expect(await cache.get("key1")).toBe("");
    });

    it("should handle large values", async () => {
      const largeValue = "x".repeat(10000);
      await cache.set("key1", largeValue);
      expect(await cache.get("key1")).toBe(largeValue);
    });

    it("should handle special characters in keys", async () => {
      await cache.set("key:with:colons", "value1");
      await cache.set("key/with/slashes", "value2");
      await cache.set("key-with-dashes", "value3");

      expect(await cache.get("key:with:colons")).toBe("value1");
      expect(await cache.get("key/with/slashes")).toBe("value2");
      expect(await cache.get("key-with-dashes")).toBe("value3");
    });

    it("should handle concurrent operations", async () => {
      const promises: Promise<void>[] = [];
      for (let i = 0; i < 100; i++) {
        promises.push(cache.set(`key${i}`, `value${i}`));
      }
      await Promise.all(promises);

      const getPromises: Promise<string | null>[] = [];
      for (let i = 0; i < 100; i++) {
        getPromises.push(cache.get(`key${i}`));
      }
      const values = await Promise.all(getPromises);

      for (let i = 0; i < 100; i++) {
        expect(values[i]).toBe(`value${i}`);
      }
    });
  });
});
