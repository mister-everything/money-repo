import { describe, expect, it } from "vitest";
import { applyStateUpdate } from "./apply-state-update";

describe("applyStateUpdate", () => {
  it("should update state with partial object", () => {
    const prevState = { a: 1, b: 2, c: 3 };
    const result = applyStateUpdate(prevState, { b: 20 });

    expect(result).toEqual({ a: 1, b: 20, c: 3 });
  });

  it("should update state with function", () => {
    const prevState = { count: 5, name: "test" };
    const result = applyStateUpdate(prevState, (prev) => ({
      count: prev.count + 1,
    }));

    expect(result).toEqual({ count: 6, name: "test" });
  });
});

