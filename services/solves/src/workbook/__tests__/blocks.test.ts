import { describe, expect, it } from "vitest";
import { All_BLOCKS } from "../blocks";

const textOption = {
  id: "option-1",
  type: "text" as const,
  text: "text option",
};

describe("blocks", () => {
  it("exposes the expected block types", () => {
    expect(Object.keys(All_BLOCKS)).toEqual(
      expect.arrayContaining(["default", "mcq", "ranking", "ox"]),
    );
  });

  it("validates MCQ content requires at least two options", () => {
    const { contentSchema } = All_BLOCKS.mcq;

    expect(() =>
      contentSchema.parse({
        type: "mcq",
        question: "choose cities",
        options: [textOption],
      }),
    ).toThrowError();

    const parsed = contentSchema.parse({
      type: "mcq",
      question: "choose cities",
      options: [
        textOption,
        { ...textOption, id: "option-2", text: "second option" },
      ],
    });

    expect(parsed.options).toHaveLength(2);
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
