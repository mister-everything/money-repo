import { describe, expect, it } from "vitest";
import { SOLVES_PROTOCOL_TAG } from "../const";
import {
  fail,
  isSafeFail,
  isSafeOk,
  isSafeResponse,
  ok,
  safeFail,
  safeOk,
} from "./interface";

describe("interface", () => {
  describe("safeOk / ok", () => {
    it("should create a successful response", () => {
      const data = { value: 42 };
      const response = safeOk(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.$tag).toBe(SOLVES_PROTOCOL_TAG);
    });

    it("ok should be an alias for safeOk", () => {
      const data = { test: "data" };
      const response1 = safeOk(data);
      const response2 = ok(data);

      expect(response1).toEqual(response2);
    });

    it("should work with different data types", () => {
      const stringResult = ok("success");
      expect(stringResult.data).toBe("success");

      const numberResult = ok(123);
      expect(numberResult.data).toBe(123);

      const arrayResult = ok([1, 2, 3]);
      expect(arrayResult.data).toEqual([1, 2, 3]);

      const nullResult = ok(null);
      expect(nullResult.data).toBe(null);
    });
  });

  describe("safeFail / fail", () => {
    it("should create a fail response with message", () => {
      const response = safeFail("Something went wrong");

      expect(response.success).toBe(false);
      expect(response.message).toBe("Something went wrong");
      expect(response.$tag).toBe(SOLVES_PROTOCOL_TAG);
      expect(response.fields).toEqual({});
      expect(response.error).toBeUndefined();
    });

    it("should create a fail response with fields", () => {
      const fields = {
        email: ["Invalid email format"],
        password: ["Password too short", "Password must contain a number"],
      };
      const response = safeFail("Validation failed", fields);

      expect(response.success).toBe(false);
      expect(response.message).toBe("Validation failed");
      expect(response.fields).toEqual(fields);
    });

    it("should create a fail response with error object", () => {
      const error = new Error("Test error");
      const response = safeFail("Error occurred", undefined, error);

      expect(response.success).toBe(false);
      expect(response.message).toBe("Error occurred");
      expect(response.error).toBe(error);
      expect(response.fields).toEqual({});
    });

    it("should create a fail response with all parameters", () => {
      const error = new Error("Test error");
      const fields = { field: ["error"] };
      const response = safeFail("Complete fail", fields, error);

      expect(response.success).toBe(false);
      expect(response.message).toBe("Complete fail");
      expect(response.fields).toEqual(fields);
      expect(response.error).toBe(error);
    });

    it("fail should be an alias for safeFail", () => {
      const response1 = safeFail("Error");
      const response2 = fail("Error");

      expect(response1).toEqual(response2);
    });
  });

  describe("isSafeResponse", () => {
    it("should return true for valid SafeSuccessResponse", () => {
      const response = ok({ data: "test" });
      expect(isSafeResponse(response)).toBe(true);
    });

    it("should return true for valid SafeFailResponse", () => {
      const response = fail("Error");
      expect(isSafeResponse(response)).toBe(true);
    });

    it("should return false for objects without $tag", () => {
      const response = { success: true, data: "test" };
      expect(isSafeResponse(response)).toBe(false);
    });

    it("should return false for objects with wrong $tag", () => {
      const response = { success: true, data: "test", $tag: "wrong-tag" };
      expect(isSafeResponse(response)).toBe(false);
    });

    it("should return false for non-objects", () => {
      expect(isSafeResponse(null)).toBe(false);
      expect(isSafeResponse(undefined)).toBe(false);
      expect(isSafeResponse("string")).toBe(false);
      expect(isSafeResponse(123)).toBe(false);
      expect(isSafeResponse(true)).toBe(false);
    });

    it("should return false for arrays", () => {
      expect(isSafeResponse([])).toBe(false);
      expect(isSafeResponse([1, 2, 3])).toBe(false);
    });
  });

  describe("isSafeOk", () => {
    it("should return true for SafeSuccessResponse", () => {
      const response = ok({ value: 42 });
      expect(isSafeOk(response)).toBe(true);
    });

    it("should return false for SafeFailResponse", () => {
      const response = fail("Error");
      expect(isSafeOk(response)).toBe(false);
    });

    it("should return false for non-SafeResponse objects", () => {
      const response = { success: true, data: "test" };
      expect(isSafeOk(response)).toBe(false);
    });

    it("should work with type narrowing", () => {
      const response = ok({ value: 42 });

      if (isSafeOk(response)) {
        // TypeScript should know this is SafeSuccessResponse
        expect(response.data.value).toBe(42);
      } else {
        throw new Error("Should be ok");
      }
    });
  });

  describe("isSafeFail", () => {
    it("should return true for SafeFailResponse", () => {
      const response = fail("Error message");
      expect(isSafeFail(response)).toBe(true);
    });

    it("should return false for SafeSuccessResponse", () => {
      const response = ok({ value: 42 });
      expect(isSafeFail(response)).toBe(false);
    });

    it("should return false for non-SafeResponse objects", () => {
      const response = { success: false, message: "Error" };
      expect(isSafeFail(response)).toBe(false);
    });

    it("should work with type narrowing", () => {
      const response = fail("Error", { field: ["error"] });

      if (isSafeFail(response)) {
        // TypeScript should know this is SafeFailResponse
        expect(response.message).toBe("Error");
        expect(response.fields.field).toEqual(["error"]);
      } else {
        throw new Error("Should be fail");
      }
    });
  });

  describe("type guards interaction", () => {
    it("should correctly identify response types in control flow", () => {
      const successResponse = ok({ data: "success" });
      const failResponse = fail("error");

      // Success case
      expect(isSafeResponse(successResponse)).toBe(true);
      expect(isSafeOk(successResponse)).toBe(true);
      expect(isSafeFail(successResponse)).toBe(false);

      // Fail case
      expect(isSafeResponse(failResponse)).toBe(true);
      expect(isSafeOk(failResponse)).toBe(false);
      expect(isSafeFail(failResponse)).toBe(true);
    });

    it("should handle generic types correctly", () => {
      type UserData = { id: number; name: string };
      const userResponse = ok<UserData>({ id: 1, name: "Alice" });

      expect(isSafeOk<UserData>(userResponse)).toBe(true);
      if (isSafeOk<UserData>(userResponse)) {
        expect(userResponse.data.id).toBe(1);
        expect(userResponse.data.name).toBe("Alice");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle empty fields object", () => {
      const response = fail("Error", {});
      expect(response.fields).toEqual({});
    });

    it("should handle undefined fields parameter", () => {
      const response = fail("Error", undefined);
      expect(response.fields).toEqual({});
    });

    it("should handle complex data structures", () => {
      const complexData = {
        user: { id: 1, name: "Alice" },
        items: [1, 2, 3],
        metadata: { timestamp: new Date(), tags: ["tag1", "tag2"] },
      };

      const response = ok(complexData);

      expect(isSafeOk(response)).toBe(true);
      if (isSafeOk(response)) {
        expect(response.data).toEqual(complexData);
      }
    });

    it("should handle multiple field errors", () => {
      const fields = {
        email: ["Required", "Invalid format"],
        password: ["Too short", "Missing special character", "Missing number"],
        username: ["Already taken"],
      };

      const response = fail("Multiple validation errors", fields);

      expect(response.fields).toEqual(fields);
      expect(Object.keys(response.fields)).toHaveLength(3);
    });
  });
});
