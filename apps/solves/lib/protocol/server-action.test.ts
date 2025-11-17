import { describe, expect, it, vi } from "vitest";
import z from "zod";
import { fail, isSafeFail, isSafeOk, ok } from "./interface";
import { createActionFactory } from "./server-action";

describe("createActionFactory", () => {
  describe("basic functionality", () => {
    it("should create action without schema", async () => {
      const createAction = createActionFactory({});
      const action = createAction(async (data: { name: string }) => {
        return { greeting: `Hello, ${data.name}!` };
      });

      const result = await action({ name: "World" });

      expect(isSafeOk(result)).toBe(true);
      if (isSafeOk(result)) {
        expect(result.data).toEqual({ greeting: "Hello, World!" });
      }
    });

    it("should create action with schema validation", async () => {
      const createAction = createActionFactory({});
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().positive(),
      });

      const action = createAction(schema, async (data) => {
        return { message: `${data.name} is ${data.age} years old` };
      });

      const result = await action({ name: "Alice", age: 25 });

      expect(isSafeOk(result)).toBe(true);
      if (isSafeOk(result)) {
        expect(result.data).toEqual({ message: "Alice is 25 years old" });
      }
    });

    it("should handle synchronous handler", async () => {
      const createAction = createActionFactory({});
      const action = createAction((data: { value: number }) => {
        return { doubled: data.value * 2 };
      });

      const result = await action({ value: 5 });

      expect(isSafeOk(result)).toBe(true);
      if (isSafeOk(result)) {
        expect(result.data).toEqual({ doubled: 10 });
      }
    });
  });

  describe("schema validation", () => {
    it("should fail when schema validation fails", async () => {
      const createAction = createActionFactory({});
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });

      const action = createAction(schema, async (data) => {
        return { success: true };
      });

      const result = await action({ email: "invalid", password: "short" });

      expect(isSafeFail(result)).toBe(true);
      if (isSafeFail(result)) {
        expect(result.message).toBe("입력값을 확인해주세요.");
        expect(result.fields).toBeDefined();
        expect(result.fields.email).toBeDefined();
        expect(result.fields.password).toBeDefined();
      }
    });

    it("should pass validated data to handler", async () => {
      const createAction = createActionFactory({});
      const schema = z.object({
        name: z.string().transform((s) => s.toUpperCase()),
      });

      const action = createAction(schema, async (data) => {
        return { name: data.name };
      });

      const result = await action({ name: "alice" });

      expect(isSafeOk(result)).toBe(true);
      if (isSafeOk(result)) {
        expect(result.data.name).toBe("ALICE");
      }
    });
  });

  describe("middleware support", () => {
    it("should execute before middleware", async () => {
      const beforeMw = vi.fn((input) => {
        return { ...input, modified: true };
      });

      const createAction = createActionFactory({
        middleware: {
          before: [beforeMw],
        },
      });

      const handler = vi.fn(async (data: any) => {
        return { result: data };
      });

      const action = createAction(handler);
      const result = await action({ value: 1 });

      expect(beforeMw).toHaveBeenCalledWith({ value: 1 });
      expect(handler).toHaveBeenCalledWith({ value: 1, modified: true });
      expect(isSafeOk(result)).toBe(true);
    });

    it("should execute multiple before middlewares in order", async () => {
      const order: number[] = [];
      const mw1 = vi.fn((input) => {
        order.push(1);
        return { ...input, mw1: true };
      });
      const mw2 = vi.fn((input) => {
        order.push(2);
        return { ...input, mw2: true };
      });

      const createAction = createActionFactory({
        middleware: {
          before: [mw1, mw2],
        },
      });

      const action = createAction(async (data: any) => {
        return data;
      });

      await action({ value: 1 });

      expect(order).toEqual([1, 2]);
      expect(mw1).toHaveBeenCalledWith({ value: 1 });
      expect(mw2).toHaveBeenCalledWith({ value: 1, mw1: true });
    });

    it("should execute after middleware on success", async () => {
      const afterMw = vi.fn((output) => {
        if (isSafeOk(output)) {
          return ok({ ...output.data, modified: true });
        }
        return output;
      });

      const createAction = createActionFactory({
        middleware: {
          after: [afterMw],
        },
      });

      const action = createAction(async () => {
        return { result: "success" };
      });

      const result = await action({});

      expect(afterMw).toHaveBeenCalled();
      expect(isSafeOk(result)).toBe(true);
      if (isSafeOk(result)) {
        expect(result.data).toEqual({ result: "success", modified: true });
      }
    });

    it("should execute after middleware on error", async () => {
      const afterMw = vi.fn((output) => {
        if (isSafeFail(output)) {
          return fail("Custom error message");
        }
        return output;
      });

      const createAction = createActionFactory({
        middleware: {
          after: [afterMw],
        },
      });

      const action = createAction(async () => {
        throw new Error("Original error");
      });

      const result = await action({});

      expect(afterMw).toHaveBeenCalled();
      expect(isSafeFail(result)).toBe(true);
      if (isSafeFail(result)) {
        expect(result.message).toBe("Custom error message");
      }
    });

    it("should execute multiple after middlewares in order", async () => {
      const order: number[] = [];
      const mw1 = vi.fn((output) => {
        order.push(1);
        return output;
      });
      const mw2 = vi.fn((output) => {
        order.push(2);
        return output;
      });

      const createAction = createActionFactory({
        middleware: {
          after: [mw1, mw2],
        },
      });

      const action = createAction(async () => ({ result: "ok" }));
      await action({});

      expect(order).toEqual([1, 2]);
    });
  });

  describe("error handling", () => {
    it("should catch and wrap errors", async () => {
      const createAction = createActionFactory({});
      const action = createAction(async () => {
        throw new Error("Something went wrong");
      });

      const result = await action({});

      expect(isSafeFail(result)).toBe(true);
      if (isSafeFail(result)) {
        expect(result.message).toBe("Something went wrong");
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it("should handle non-Error throws", async () => {
      const createAction = createActionFactory({});
      const action = createAction(async () => {
        throw "String error";
      });

      const result = await action({});

      expect(isSafeFail(result)).toBe(true);
      if (isSafeFail(result)) {
        expect(result.message).toBe("String error");
      }
    });

    it("should run after middleware even on error", async () => {
      const afterMw = vi.fn((output) => output);

      const createAction = createActionFactory({
        middleware: {
          after: [afterMw],
        },
      });

      const action = createAction(async () => {
        throw new Error("Test error");
      });

      await action({});

      expect(afterMw).toHaveBeenCalled();
    });
  });

  describe("SafeResponse handling", () => {
    it("should pass through SafeResponse from handler", async () => {
      const createAction = createActionFactory({});
      const action = createAction(async () => {
        return ok({ value: 42 });
      });

      const result = await action({});

      expect(isSafeOk(result)).toBe(true);
      if (isSafeOk(result)) {
        expect(result.data).toEqual({ value: 42 });
      }
    });

    it("should pass through SafeFailResponse from handler", async () => {
      const createAction = createActionFactory({});
      const action = createAction(async () => {
        return fail("Custom fail message");
      });

      const result = await action({});

      expect(isSafeFail(result)).toBe(true);
      if (isSafeFail(result)) {
        expect(result.message).toBe("Custom fail message");
      }
    });

    it("should wrap non-SafeResponse values", async () => {
      const createAction = createActionFactory({});
      const action = createAction(async () => {
        return { plain: "value" };
      });

      const result = await action({});

      expect(isSafeOk(result)).toBe(true);
      if (isSafeOk(result)) {
        expect(result.data).toEqual({ plain: "value" });
      }
    });
  });

  describe("integration scenarios", () => {
    it("should work with schema, before middleware, after middleware, and error handling", async () => {
      const beforeMw = vi.fn((input) => ({ ...input, timestamp: Date.now() }));
      const afterMw = vi.fn((output) => {
        if (isSafeOk(output)) {
          return ok({ ...output.data, processed: true });
        }
        return output;
      });

      const createAction = createActionFactory({
        middleware: {
          before: [beforeMw],
          after: [afterMw],
        },
      });

      const schema = z
        .object({
          value: z.number(),
        })
        .passthrough(); // before middleware에서 추가한 필드 허용

      const action = createAction(schema, async (data: any) => {
        return { value: data.value * 2, timestamp: data.timestamp };
      });

      const result = await action({ value: 5 });

      expect(beforeMw).toHaveBeenCalled();
      expect(afterMw).toHaveBeenCalled();
      expect(isSafeOk(result)).toBe(true);
      if (isSafeOk(result)) {
        expect(result.data.value).toBe(10);
        expect((result.data as any).processed).toBe(true);
        expect((result.data as any).timestamp).toBeDefined();
      }
    });

    it("should call before middleware even when schema validation fails", async () => {
      const beforeMw = vi.fn((input) => input);

      const createAction = createActionFactory({
        middleware: {
          before: [beforeMw],
        },
      });

      const schema = z.object({
        email: z.string().email(),
      });

      const action = createAction(schema, async () => ({ success: true }));

      const result = await action({ email: "invalid" });

      // before middleware는 스키마 검증 전에 실행됨
      expect(beforeMw).toHaveBeenCalledWith({ email: "invalid" });
      expect(isSafeFail(result)).toBe(true);
      if (isSafeFail(result)) {
        expect(result.message).toBe("입력값을 확인해주세요.");
      }
    });
  });
});
