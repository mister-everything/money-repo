import type {
  DefaultBlockAnswer,
  DefaultBlockAnswerSubmit,
  DefaultBlockContent,
  MatchingBlockAnswer,
  MatchingBlockAnswerSubmit,
  MatchingBlockContent,
  McqBlockAnswer,
  McqBlockAnswerSubmit,
  McqBlockContent,
  OxBlockAnswer,
  OxBlockAnswerSubmit,
  OxBlockContent,
  ProbBlockAnswer,
  ProbBlockAnswerSubmit,
  ProbBlockContent,
  RankingBlockAnswer,
  RankingBlockAnswerSubmit,
  RankingBlockContent,
} from "../types";

// ============================================================
// Type Guards (타입 가드 유틸리티)
// ============================================================

/**
 * Type Guard: 주관식 문제인지 확인
 */
export const isDefaultContent = (
  block: ProbBlockContent,
): block is DefaultBlockContent => {
  return block.type === "default";
};

/**
 * Type Guard: 객관식 문제인지 확인
 */
export const isMcqContent = (
  block: ProbBlockContent,
): block is McqBlockContent => {
  return block.type === "mcq";
};

/**
 * Type Guard: 순위 맞추기 문제인지 확인
 */
export const isRankingContent = (
  block: ProbBlockContent,
): block is RankingBlockContent => {
  return block.type === "ranking";
};

/**
 * Type Guard: OX 퀴즈 문제인지 확인
 */
export const isOxContent = (
  block: ProbBlockContent,
): block is OxBlockContent => {
  return block.type === "ox";
};

/**
 * Type Guard: 매칭 퀴즈 문제인지 확인
 */
export const isMatchingContent = (
  block: ProbBlockContent,
): block is MatchingBlockContent => {
  return block.type === "matching";
};

// ============================================================
// Answer Validation Functions (답안 검증 함수들)
// ============================================================

/**
 * 주관식 답안 검증
 */
export const checkDefaultAnswer = (
  correctAnswer: DefaultBlockAnswer,
  submittedAnswer: DefaultBlockAnswerSubmit,
): boolean => {
  const submitted = submittedAnswer.answer;
  return correctAnswer.answer.some((answer) => submitted === answer);
};

/**
 * 객관식 답안 검증
 */
export const checkMcqAnswer = (
  correctAnswer: McqBlockAnswer,
  submittedAnswer: McqBlockAnswerSubmit,
): boolean => {
  const submitted = submittedAnswer.answer;
  return (
    submitted.length === correctAnswer.answer.length &&
    correctAnswer.answer.every((answer) => submitted.includes(answer))
  );
};

/**
 * 순위 맞추기 답안 검증
 */
export const checkRankingAnswer = (
  correctAnswer: RankingBlockAnswer,
  submittedAnswer: RankingBlockAnswerSubmit,
): boolean => {
  const correct = correctAnswer.order;
  const submitted = submittedAnswer.order;

  if (correct.length !== submitted.length) return false;
  return correct.every((id, index) => id === submitted[index]);
};

/**
 * OX 퀴즈 답안 검증
 */
export const checkOxAnswer = (
  correctAnswer: OxBlockAnswer,
  submittedAnswer: OxBlockAnswerSubmit,
): boolean => {
  return correctAnswer.answer === submittedAnswer.answer;
};

/**
 * 매칭 퀴즈 답안 검증
 */
export const checkMatchingAnswer = (
  correctAnswer: MatchingBlockAnswer,
  submittedAnswer: MatchingBlockAnswerSubmit,
): boolean => {
  const correctPairs = correctAnswer.pairs;
  const submittedPairs = submittedAnswer.pairs;

  if (correctPairs.length !== submittedPairs.length) return false;

  return correctPairs.every((correctPair) =>
    submittedPairs.some(
      (submittedPair) =>
        correctPair.leftId === submittedPair.leftId &&
        correctPair.rightId === submittedPair.rightId,
    ),
  );
};

/**
 * 메인 답안 체크 함수 - 모든 문제 타입 지원
 */
export const checkAnswer = (
  correctAnswer?: ProbBlockAnswer,
  submittedAnswer?: ProbBlockAnswerSubmit,
): boolean => {
  if (!correctAnswer || !submittedAnswer) return false;
  if (correctAnswer.type !== submittedAnswer.type) return false;

  switch (correctAnswer.type) {
    case "default":
      if (submittedAnswer.type !== "default") return false;
      return checkDefaultAnswer(correctAnswer, submittedAnswer);
    case "mcq":
      if (submittedAnswer.type !== "mcq") return false;
      return checkMcqAnswer(correctAnswer, submittedAnswer);
    case "ranking":
      if (submittedAnswer.type !== "ranking") return false;
      return checkRankingAnswer(correctAnswer, submittedAnswer);
    case "ox":
      if (submittedAnswer.type !== "ox") return false;
      return checkOxAnswer(correctAnswer, submittedAnswer);
    case "matching":
      if (submittedAnswer.type !== "matching") return false;
      return checkMatchingAnswer(correctAnswer, submittedAnswer);
    default:
      throw new Error("정의되지 않은 문제 형태");
  }
};
