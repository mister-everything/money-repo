import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { blockBuilder } from "../create-block";
import {
  ProbCheckerError,
  ProbInvalidAnswerError,
  ProbInvalidAnswerSubmitError,
} from "../error";

describe("blockBuilder", () => {
  it("throws when answer schema is missing", () => {
    const builder = blockBuilder("missing-answer");

    expect(() => builder.build()).toThrowError(
      "missing-answer 블록의 정답 스키마가 없습니다.",
    );
  });

  it("throws when answer submit schema is missing", () => {
    const builder = blockBuilder("missing-submit").answer(
      z.object({ value: z.string() }),
    );

    expect(() => builder.build()).toThrowError(
      "missing-submit 블록의 제출 답안 스키마가 없습니다.",
    );
  });

  it("throws when checker is missing", () => {
    const builder = blockBuilder("missing-checker")
      .answer(z.object({ value: z.string() }))
      .answerSubmit(z.object({ value: z.string() }));

    expect(() => builder.build()).toThrowError(
      "missing-checker 블록의 체커 함수가 없습니다.",
    );
  });

  it("throws ProbInvalidAnswerError when the correct answer fails validation", () => {
    const block = blockBuilder("validate-answer")
      .answer(
        z.object({
          value: z.string().min(1),
        }),
      )
      .answerSubmit(
        z.object({
          value: z.string().min(1),
        }),
      )
      .checker(() => true)
      .build();

    expect(() =>
      block.checkAnswer(
        { type: "validate-answer" },
        { type: "validate-answer", value: "ok" },
      ),
    ).toThrowError(ProbInvalidAnswerError);
  });

  it("throws ProbInvalidAnswerSubmitError when the submitted answer fails validation", () => {
    const block = blockBuilder("validate-submit")
      .answer(
        z.object({
          value: z.string(),
        }),
      )
      .answerSubmit(
        z.object({
          value: z.string(),
        }),
      )
      .checker(() => true)
      .build();

    expect(() =>
      block.checkAnswer(
        { type: "validate-submit", value: "valid" },
        { type: "validate-submit" },
      ),
    ).toThrowError(ProbInvalidAnswerSubmitError);
  });

  it("calls the checker with parsed data when validation succeeds", () => {
    const checker = vi.fn().mockReturnValue(true);
    const block = blockBuilder("call-checker")
      .answer(
        z.object({
          value: z.string(),
        }),
      )
      .answerSubmit(
        z.object({
          value: z.string(),
        }),
      )
      .checker((correct, submitted) => checker(correct, submitted))
      .build();

    const result = block.checkAnswer(
      { type: "call-checker", value: "answer" },
      { type: "call-checker", value: "answer" },
    );

    expect(result).toBe(true);
    expect(checker).toHaveBeenCalled();
    const lastCall = checker.mock.calls[checker.mock.calls.length - 1];
    const [correctArg, submittedArg] = lastCall;

    expect(correctArg).toEqual({ type: "call-checker", value: "answer" });
    expect(submittedArg).toEqual({ type: "call-checker", value: "answer" });
  });

  it("returns false when the checker reports a mismatch", () => {
    const block = blockBuilder("checker-error")
      .answer(
        z.object({
          value: z.string(),
        }),
      )
      .answerSubmit(
        z.object({
          value: z.string(),
        }),
      )
      .checker(() => false)
      .build();

    const result = block.checkAnswer(
      { type: "checker-error", value: "correct" },
      { type: "checker-error", value: "submitted" },
    );

    expect(result).toBe(false);
  });

  it("wraps checker exceptions with ProbCheckerError", () => {
    const block = blockBuilder("checker-exception")
      .answer(
        z.object({
          value: z.string(),
        }),
      )
      .answerSubmit(
        z.object({
          value: z.string(),
        }),
      )
      .checker(() => {
        throw new Error("checker exploded");
      })
      .build();

    try {
      block.checkAnswer(
        { type: "checker-exception", value: "correct" },
        { type: "checker-exception", value: "submitted" },
      );
      expect.fail("checkAnswer should throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ProbCheckerError);
      const checkerError = error as ProbCheckerError;
      expect(checkerError.correctAnswer).toEqual({
        type: "checker-exception",
        value: "correct",
      });
      expect(checkerError.submittedAnswer).toEqual({
        type: "checker-exception",
        value: "submitted",
      });
    }
  });
});
