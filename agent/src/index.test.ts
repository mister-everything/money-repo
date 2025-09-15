import { describe, expect, it } from "vitest";

describe("index.ts", () => {
  it("should pass basic test", () => {
    expect(true).toBe(true);
  });

  it("should have working math", () => {
    expect(1 + 1).toBe(2);
  });
});
