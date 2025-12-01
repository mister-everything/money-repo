import { describe, expect, it } from "vitest";
import { All_BLOCKS } from "../blocks";

describe("blocks", () => {
  it("exposes the expected block types", () => {
    expect(Object.keys(All_BLOCKS)).toEqual(
      expect.arrayContaining(["default", "mcq", "ranking", "ox"]),
    );
  });

  it("requires ranking answers to contain at least two items", () => {
    const { answerSchema } = All_BLOCKS.ranking;

    expect(() =>
      answerSchema.parse({
        type: "ranking",
        order: ["only-one"],
      }),
    ).toThrowError();

    expect(() =>
      answerSchema.parse({
        type: "ranking",
        order: ["first", "second"],
      }),
    ).not.toThrow();
  });

  it("restricts OX answers to the literal values", () => {
    const { answerSchema } = All_BLOCKS.ox;

    expect(() =>
      answerSchema.parse({
        type: "ox",
        answer: true,
      }),
    ).not.toThrow();

    expect(() =>
      answerSchema.parse({
        type: "ox",
        answer: "invalid",
      }),
    ).toThrowError();
  });

  it("enforces non-empty answers for default blocks", () => {
    const { answerSchema } = All_BLOCKS.default;

    expect(() =>
      answerSchema.parse({
        type: "default",
        answer: ["서울"],
      }),
    ).not.toThrow();

    expect(() =>
      answerSchema.parse({
        type: "default",
        answer: [],
      }),
    ).toThrowError();
  });
});
