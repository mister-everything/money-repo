/**
 * 클라이언트용 타입 및 안전한 유틸 함수 export
 * Node.js 전용 모듈(drizzle-orm, pg 등)을 import하지 않습니다.
 */

// blocks.ts - 타입과 상수 export (zod만 사용하므로 안전)
export type {
  BlockAnswer,
  BlockAnswerSubmit,
  BlockContent,
  BlockType,
  DefaultBlockAnswer,
  DefaultBlockAnswerSubmit,
  DefaultBlockContent,
  McqBlockContent,
  OxBlockContent,
} from "./prob/blocks";

// error.ts - 에러 클래스들 export
export {
  ProbCheckerError,
  ProbError,
  ProbInvalidAnswerError,
  ProbInvalidAnswerSubmitError,
  ProbWrongAnswerError,
} from "./prob/error";

// types.ts - 타입들 export
export type {
  CreateProbBlock,
  CreateProbBook,
  ProbBlock,
  ProbBlockWithoutAnswer,
  ProbBook,
  ProbBookWithoutBlocks,
  Tag,
} from "./prob/types";

// utils.ts - 유틸 함수들 export (zod만 사용하므로 안전)
export {
  checkAnswer,
  isAnswer,
  isAnswerSubmit,
  isContent,
  parseAnswer,
  parseAnswerSubmit,
  parseContent,
} from "./prob/utils";

// ⚠️ prob.service는 export하지 않음 - drizzle-orm 사용
