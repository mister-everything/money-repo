import { describe, expect, it } from "vitest";
import equal from "./equal";

describe("equal function", () => {
  describe("primitive values", () => {
    it("should return true for identical primitives", () => {
      expect(equal(1, 1)).toBe(true);
      expect(equal("hello", "hello")).toBe(true);
      expect(equal(true, true)).toBe(true);
      expect(equal(null, null)).toBe(true);
      expect(equal(undefined, undefined)).toBe(true);
    });

    it("should return false for different primitives", () => {
      expect(equal(1, 2)).toBe(false);
      expect(equal("hello", "world")).toBe(false);
      expect(equal(true, false)).toBe(false);
      expect(equal(null, undefined)).toBe(false);
    });

    it("should handle NaN correctly", () => {
      expect(equal(NaN, NaN)).toBe(true);
      expect(equal(NaN, 1)).toBe(false);
    });

    it("should handle zero values", () => {
      expect(equal(0, 0)).toBe(true);
      expect(equal(-0, -0)).toBe(true);
      expect(equal(0, -0)).toBe(true); // JS behavior: 0 === -0
    });
  });

  describe("arrays", () => {
    it("should return true for identical arrays", () => {
      expect(equal([], [])).toBe(true);
      expect(equal([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(equal([1, [2, 3]], [1, [2, 3]])).toBe(true);
    });

    it("should return false for different arrays", () => {
      expect(equal([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(equal([1, 2], [1, 2, 3])).toBe(false);
      expect(equal([1, 2, 3], [3, 2, 1])).toBe(false);
    });

    it("should handle nested arrays", () => {
      expect(
        equal(
          [
            [1, 2],
            [3, 4],
          ],
          [
            [1, 2],
            [3, 4],
          ],
        ),
      ).toBe(true);
      expect(
        equal(
          [
            [1, 2],
            [3, 4],
          ],
          [
            [1, 2],
            [3, 5],
          ],
        ),
      ).toBe(false);
    });

    it("should handle arrays with different types", () => {
      expect(equal([1, "2"], [1, "2"])).toBe(true);
      expect(equal([1, "2"], [1, 2])).toBe(false);
    });
  });

  describe("objects", () => {
    it("should return true for identical objects", () => {
      expect(equal({}, {})).toBe(true);
      expect(equal({ a: 1 }, { a: 1 })).toBe(true);
      expect(equal({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(equal({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    });

    it("should return false for different objects", () => {
      expect(equal({ a: 1 }, { a: 2 })).toBe(false);
      expect(equal({ a: 1 }, { b: 1 })).toBe(false);
      expect(equal({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    });

    it("should handle nested objects", () => {
      expect(equal({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
      expect(equal({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
    });

    it("should handle objects with array values", () => {
      expect(equal({ arr: [1, 2, 3] }, { arr: [1, 2, 3] })).toBe(true);
      expect(equal({ arr: [1, 2, 3] }, { arr: [1, 2, 4] })).toBe(false);
    });
  });

  describe("Date objects", () => {
    it("should return true for same dates", () => {
      const date1 = new Date("2023-01-01");
      const date2 = new Date("2023-01-01");
      expect(equal(date1, date2)).toBe(true);
    });

    it("should return false for different dates", () => {
      const date1 = new Date("2023-01-01");
      const date2 = new Date("2023-01-02");
      expect(equal(date1, date2)).toBe(false);
    });

    it("should return false when comparing date with non-date", () => {
      const date = new Date("2023-01-01");
      expect(equal(date, "2023-01-01")).toBe(false);
      expect(equal(date, date.getTime())).toBe(false);
    });
  });

  describe("RegExp objects", () => {
    it("should return true for identical RegExp", () => {
      expect(equal(/abc/g, /abc/g)).toBe(true);
      expect(equal(/test/i, /test/i)).toBe(true);
    });

    it("should return false for different RegExp", () => {
      expect(equal(/abc/g, /abc/i)).toBe(false);
      expect(equal(/abc/, /def/)).toBe(false);
    });

    it("should return false when comparing RegExp with non-RegExp", () => {
      expect(equal(/abc/, "abc")).toBe(false);
    });
  });

  describe("Map objects", () => {
    it("should return true for identical Maps", () => {
      const map1 = new Map([
        ["a", 1],
        ["b", 2],
      ]);
      const map2 = new Map([
        ["a", 1],
        ["b", 2],
      ]);
      expect(equal(map1, map2)).toBe(true);
    });

    it("should return true for Maps with different insertion order", () => {
      const map1 = new Map([
        ["a", 1],
        ["b", 2],
      ]);
      const map2 = new Map([
        ["b", 2],
        ["a", 1],
      ]);
      expect(equal(map1, map2)).toBe(true);
    });

    it("should return false for different Maps", () => {
      const map1 = new Map([
        ["a", 1],
        ["b", 2],
      ]);
      const map2 = new Map([
        ["a", 1],
        ["b", 3],
      ]);
      expect(equal(map1, map2)).toBe(false);
    });

    it("should return false for Maps with different sizes", () => {
      const map1 = new Map([["a", 1]]);
      const map2 = new Map([
        ["a", 1],
        ["b", 2],
      ]);
      expect(equal(map1, map2)).toBe(false);
    });

    it("should handle nested values in Maps", () => {
      const map1 = new Map([["a", { nested: true }]]);
      const map2 = new Map([["a", { nested: true }]]);
      expect(equal(map1, map2)).toBe(true);
    });
  });

  describe("Set objects", () => {
    it("should return true for identical Sets", () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 3]);
      expect(equal(set1, set2)).toBe(true);
    });

    it("should return true for Sets with different insertion order", () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([3, 1, 2]);
      expect(equal(set1, set2)).toBe(true);
    });

    it("should return false for different Sets", () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 4]);
      expect(equal(set1, set2)).toBe(false);
    });

    it("should return false for Sets with different sizes", () => {
      const set1 = new Set([1, 2]);
      const set2 = new Set([1, 2, 3]);
      expect(equal(set1, set2)).toBe(false);
    });
  });

  describe("mixed types", () => {
    it("should return false for different types", () => {
      expect(equal([], {})).toBe(false);
      expect(equal("123", 123)).toBe(false);
      expect(equal(true, 1)).toBe(false);
      expect(equal(null, 0)).toBe(false);
      expect(equal(undefined, null)).toBe(false);
    });

    it("should return false for objects with different prototypes", () => {
      class CustomClass {}
      const obj1 = new CustomClass();
      const obj2 = {};
      expect(equal(obj1, obj2)).toBe(false);
    });
  });

  describe("complex nested structures", () => {
    it("should handle deeply nested structures", () => {
      const obj1 = {
        arr: [1, { nested: { deep: [1, 2, 3] } }],
        map: new Map([["key", new Set([1, 2, 3])]]),
        date: new Date("2023-01-01"),
      };

      const obj2 = {
        arr: [1, { nested: { deep: [1, 2, 3] } }],
        map: new Map([["key", new Set([1, 2, 3])]]),
        date: new Date("2023-01-01"),
      };

      expect(equal(obj1, obj2)).toBe(true);
    });

    it("should detect differences in deeply nested structures", () => {
      const obj1 = {
        arr: [1, { nested: { deep: [1, 2, 3] } }],
        map: new Map([["key", new Set([1, 2, 3])]]),
      };

      const obj2 = {
        arr: [1, { nested: { deep: [1, 2, 4] } }],
        map: new Map([["key", new Set([1, 2, 3])]]),
      };

      expect(equal(obj1, obj2)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle circular references (currently throws)", () => {
      const obj1: any = { a: 1 };
      obj1.self = obj1;

      const obj2: any = { a: 1 };
      obj2.self = obj2;

      // Note: The current implementation doesn't handle circular references
      // and will throw RangeError due to stack overflow
      expect(() => equal(obj1, obj2)).toThrow(
        "Maximum call stack size exceeded",
      );
    });

    it("should handle very large arrays", () => {
      const arr1 = new Array(1000).fill(1);
      const arr2 = new Array(1000).fill(1);
      expect(equal(arr1, arr2)).toBe(true);

      arr2[999] = 2;
      expect(equal(arr1, arr2)).toBe(false);
    });
  });
});
