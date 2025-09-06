import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  capitalizeFirstLetter,
  createDebounce,
  createEmitter,
  createIncrement,
  createThrottle,
  deduplicateByKey,
  errorToString,
  exclude,
  generateUUID,
  groupBy,
  isFunction,
  isJson,
  isNull,
  isObject,
  isPromiseLike,
  isString,
  Locker,
  nextTick,
  noop,
  objectFlow,
  PromiseChain,
  randomRange,
  toAny,
  truncateString,
  wait,
  withTimeout,
} from "./util";

describe("util functions", () => {
  describe("createIncrement", () => {
    it("should create increment function with default value", () => {
      const increment = createIncrement();
      expect(increment()).toBe(0);
      expect(increment()).toBe(1);
      expect(increment()).toBe(2);
    });

    it("should create increment function with custom initial value", () => {
      const increment = createIncrement(10);
      expect(increment()).toBe(10);
      expect(increment()).toBe(11);
    });
  });

  describe("noop", () => {
    it("should do nothing", () => {
      expect(noop()).toBeUndefined();
    });
  });

  describe("wait", () => {
    it("should wait for default delay", async () => {
      const start = Date.now();
      await wait();
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(0);
    });

    it("should wait for specified delay", async () => {
      const start = Date.now();
      await wait(50);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(45);
    });
  });

  describe("randomRange", () => {
    it("should generate number within range", () => {
      const result = randomRange(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });

    it("should handle single value range", () => {
      const result = randomRange(5, 5);
      expect(result).toBe(5);
    });
  });

  describe("type checking functions", () => {
    describe("isString", () => {
      it("should return true for strings", () => {
        expect(isString("hello")).toBe(true);
        expect(isString("")).toBe(true);
      });

      it("should return false for non-strings", () => {
        expect(isString(123)).toBe(false);
        expect(isString(null)).toBe(false);
        expect(isString({})).toBe(false);
      });
    });

    describe("isFunction", () => {
      it("should return true for functions", () => {
        expect(isFunction(() => {})).toBe(true);
        expect(isFunction(function () {})).toBe(true);
        expect(isFunction(Math.max)).toBe(true);
      });

      it("should return false for non-functions", () => {
        expect(isFunction("hello")).toBe(false);
        expect(isFunction(123)).toBe(false);
        expect(isFunction({})).toBe(false);
      });
    });

    describe("isObject", () => {
      it("should return true for objects", () => {
        expect(isObject({})).toBe(true);
        expect(isObject([])).toBe(true);
        expect(isObject(new Date())).toBe(true);
      });

      it("should return false for primitives", () => {
        expect(isObject("hello")).toBe(false);
        expect(isObject(123)).toBe(false);
        expect(isObject(null)).toBe(false);
        expect(isObject(undefined)).toBe(false);
      });
    });

    describe("isNull", () => {
      it("should return true for null and undefined", () => {
        expect(isNull(null)).toBe(true);
        expect(isNull(undefined)).toBe(true);
      });

      it("should return false for other values", () => {
        expect(isNull(0)).toBe(false);
        expect(isNull("")).toBe(false);
        expect(isNull(false)).toBe(false);
      });
    });

    describe("isPromiseLike", () => {
      it("should return true for promise-like objects", () => {
        expect(isPromiseLike(Promise.resolve())).toBe(true);
        expect(isPromiseLike({ then: () => {} })).toBe(true);
      });

      it("should return false for non-promise-like objects", () => {
        expect(isPromiseLike({})).toBe(false);
        expect(isPromiseLike("hello")).toBe(false);
        expect(isPromiseLike(null)).toBe(false);
      });
    });

    describe("isJson", () => {
      it("should return true for valid JSON strings", () => {
        expect(isJson('{"key": "value"}')).toBe(true);
        expect(isJson("[]")).toBe(true);
        expect(isJson('"string"')).toBe(true);
      });

      it("should return true for objects", () => {
        expect(isJson({ key: "value" })).toBe(true);
        expect(isJson([])).toBe(true);
      });

      it("should return false for invalid JSON", () => {
        expect(isJson("invalid json")).toBe(false);
        expect(isJson("undefined")).toBe(false);
        expect(isJson(null)).toBe(false);
      });
    });
  });

  describe("createDebounce", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should debounce function calls", () => {
      const debounce = createDebounce();
      const mockFn = vi.fn();

      debounce(mockFn, 100);
      debounce(mockFn, 100);
      debounce(mockFn, 100);

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should clear debounce", () => {
      const debounce = createDebounce();
      const mockFn = vi.fn();

      debounce(mockFn, 100);
      debounce.clear();

      vi.advanceTimersByTime(100);
      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  describe("createThrottle", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should throttle function calls", () => {
      const throttle = createThrottle();
      const mockFn = vi.fn();

      throttle(mockFn, 100);
      throttle(mockFn, 100);
      throttle(mockFn, 100);

      expect(mockFn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should clear throttle", () => {
      const throttle = createThrottle();
      const mockFn = vi.fn();

      throttle(mockFn, 100);
      throttle.clear();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("groupBy", () => {
    it("should group array by key", () => {
      const data = [
        { category: "A", value: 1 },
        { category: "B", value: 2 },
        { category: "A", value: 3 },
      ];

      const result = groupBy(data, "category");

      expect(result).toEqual({
        A: [
          { category: "A", value: 1 },
          { category: "A", value: 3 },
        ],
        B: [{ category: "B", value: 2 }],
      });
    });

    it("should group array by function", () => {
      const data = [1, 2, 3, 4, 5, 6];

      const result = groupBy(data, (item) => (item % 2 === 0 ? "even" : "odd"));

      expect(result).toEqual({
        odd: [1, 3, 5],
        even: [2, 4, 6],
      });
    });
  });

  describe("PromiseChain", () => {
    it("should execute promises in sequence", async () => {
      const chain = PromiseChain();
      const results: number[] = [];

      const promise1 = chain(() => wait(10).then(() => results.push(1)));
      const promise2 = chain(() => wait(5).then(() => results.push(2)));
      const promise3 = chain(() => wait(1).then(() => results.push(3)));

      await Promise.all([promise1, promise2, promise3]);

      expect(results).toEqual([1, 2, 3]);
    });
  });

  describe("Locker", () => {
    it("should lock and unlock", async () => {
      const locker = new Locker();

      expect(locker.isLocked).toBe(false);

      locker.lock();
      expect(locker.isLocked).toBe(true);

      locker.unlock();
      expect(locker.isLocked).toBe(false);
    });

    it("should wait for unlock", async () => {
      const locker = new Locker();
      let resolved = false;

      locker.lock();

      const waitPromise = locker.wait().then(() => {
        resolved = true;
      });

      expect(resolved).toBe(false);

      locker.unlock();
      await waitPromise;

      expect(resolved).toBe(true);
    });
  });

  describe("generateUUID", () => {
    it("should generate valid UUID format", () => {
      const uuid = generateUUID();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(uuid).toMatch(uuidRegex);
    });

    it("should generate unique UUIDs", () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();

      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe("toAny", () => {
    it("should return the same value", () => {
      const value = { test: "value" };
      expect(toAny(value)).toBe(value);
    });
  });

  describe("errorToString", () => {
    it("should handle different error types", () => {
      expect(errorToString(null)).toBe("unknown error");
      expect(errorToString("string error")).toBe("string error");
      expect(errorToString(new Error("error message"))).toBe("error message");
      expect(errorToString({ custom: "error" })).toBe('{"custom":"error"}');
    });
  });

  describe("objectFlow", () => {
    const testObj = { a: 1, b: 2, c: 3 };

    it("should map object values", () => {
      const result = objectFlow(testObj).map((value) => value * 2);
      expect(result).toEqual({ a: 2, b: 4, c: 6 });
    });

    it("should filter object entries", () => {
      const result = objectFlow(testObj).filter((value) => value > 1);
      expect(result).toEqual({ b: 2, c: 3 });
    });

    it("should forEach over object", () => {
      const results: any[] = [];
      objectFlow(testObj).forEach((value, key) => {
        results.push([key, value]);
      });
      expect(results).toEqual([
        ["a", 1],
        ["b", 2],
        ["c", 3],
      ]);
    });

    it("should check some condition", () => {
      expect(objectFlow(testObj).some((value) => value > 2)).toBe(true);
      expect(objectFlow(testObj).some((value) => value > 5)).toBe(false);
    });

    it("should check every condition", () => {
      expect(objectFlow(testObj).every((value) => value > 0)).toBe(true);
      expect(objectFlow(testObj).every((value) => value > 1)).toBe(false);
    });

    it("should find value", () => {
      expect(objectFlow(testObj).find((value) => value === 2)).toBe(2);
      expect(objectFlow(testObj).find((value) => value === 5)).toBeUndefined();
    });
  });

  describe("string utilities", () => {
    describe("capitalizeFirstLetter", () => {
      it("should capitalize first letter", () => {
        expect(capitalizeFirstLetter("hello")).toBe("Hello");
        expect(capitalizeFirstLetter("HELLO")).toBe("HELLO");
        expect(capitalizeFirstLetter("")).toBe("");
      });
    });

    describe("truncateString", () => {
      it("should truncate long strings", () => {
        expect(truncateString("hello world", 5)).toBe("hello...");
        expect(truncateString("short", 10)).toBe("short");
      });
    });
  });

  describe("nextTick", () => {
    it("should resolve on next tick", async () => {
      let executed = false;

      nextTick().then(() => {
        executed = true;
      });

      expect(executed).toBe(false);
      await nextTick();
      expect(executed).toBe(true);
    });
  });

  describe("exclude", () => {
    it("should exclude specified keys", () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const result = exclude(obj, ["b", "d"]);

      expect(result).toEqual({ a: 1, c: 3 });
    });
  });

  describe("createEmitter", () => {
    it("should emit and listen to events", () => {
      const emitter = createEmitter();
      const mockListener = vi.fn();

      const unsubscribe = emitter.on(mockListener);
      emitter.emit("test");

      expect(mockListener).toHaveBeenCalledWith("test");

      unsubscribe();
      emitter.emit("test2");

      expect(mockListener).toHaveBeenCalledTimes(1);
    });

    it("should remove listeners with off", () => {
      const emitter = createEmitter();
      const mockListener = vi.fn();

      emitter.on(mockListener);
      emitter.off(mockListener);
      emitter.emit("test");

      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe("deduplicateByKey", () => {
    it("should remove duplicates by key", () => {
      const data = [
        { id: 1, name: "A" },
        { id: 2, name: "B" },
        { id: 1, name: "C" },
        { id: 3, name: "D" },
      ];

      const result = deduplicateByKey(data, "id");

      expect(result).toEqual([
        { id: 1, name: "A" },
        { id: 2, name: "B" },
        { id: 3, name: "D" },
      ]);
    });
  });

  describe("withTimeout", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should resolve promise within timeout", async () => {
      const promise = Promise.resolve("success");
      const result = await withTimeout(promise, 1000);

      expect(result).toBe("success");
    });

    it("should reject on timeout", async () => {
      const promise = new Promise((resolve) => {
        setTimeout(() => resolve("success"), 2000);
      });

      const timeoutPromise = withTimeout(promise, 1000);

      vi.advanceTimersByTime(1000);

      await expect(timeoutPromise).rejects.toThrow("Timeout");
    });
  });
});
