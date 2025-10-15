import { BlockAnswer, BlockAnswerSubmit } from "./blocks";

export class ProbError extends Error {
  displayMessage: string;
  constructor(message: string = "문제 오류가 발생했습니다.") {
    super(message);
    this.name = "ProbError";
    this.displayMessage = message;
  }
}

export class ProbWrongAnswerError extends ProbError {
  constructor() {
    super();
    this.name = "ProbWrongAnswerError";
    this.displayMessage = "오답입니다.";
  }
}

export class ProbInvalidAnswerError extends ProbError {
  constructor() {
    super();
    this.name = "ProbInvalidAnswerError";
    this.displayMessage = "잘못된 정답 형식입니다.";
  }
}

export class ProbInvalidAnswerSubmitError extends ProbError {
  constructor() {
    super();
    this.name = "ProbInvalidAnswerSubmitError";
    this.displayMessage = "잘못된 제출 형식입니다.";
  }
}

export class ProbCheckerError extends ProbError {
  correctAnswer: BlockAnswer;
  submittedAnswer: BlockAnswerSubmit;
  constructor({
    originalError,
    correctAnswer,
    submittedAnswer,
  }: {
    originalError: any;
    correctAnswer: BlockAnswer;
    submittedAnswer: BlockAnswerSubmit;
  }) {
    super(originalError?.message ?? "체커 함수 오류가 발생했습니다.");
    this.name = "ProbCheckerError";
    this.correctAnswer = correctAnswer;
    this.submittedAnswer = submittedAnswer;
    this.displayMessage = `체커 함수 오류가 발생했습니다.`;
  }
}
