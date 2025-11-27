import { describe, expect, it } from "vitest";
import { checkAnswer, isAnswer, isAnswerSubmit, isContent } from "../utils";

const mcqContent = {
  type: "mcq" as const,
  question: "도시를 모두 고르세요.",
  options: [
    { id: "1", type: "text" as const, text: "서울" },
    { id: "2", type: "text" as const, text: "부산" },
  ],
};

const mcqAnswer = {
  type: "mcq" as const,
  answer: "1",
};

const mcqAnswerSubmit = {
  type: "mcq" as const,
  answer: "1",
};

describe("workbook utils", () => {
  it("exposes type guards for content, answer, and answer submit", () => {
    expect(isContent.mcq(mcqContent)).toBe(true);
    expect(isContent.default(mcqContent)).toBe(false);

    expect(isAnswer.mcq(mcqAnswer)).toBe(true);
    expect(isAnswerSubmit.mcq(mcqAnswerSubmit)).toBe(true);
  });

  it("returns false when the correct and submitted answers do not match types", () => {
    const result = checkAnswer(
      { type: "default", answer: ["서울"] },
      mcqAnswerSubmit,
    );

    expect(result).toBe(false);
  });
});
