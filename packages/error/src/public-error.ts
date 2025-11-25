import { CustomError } from "./custom-error";

/**
 * 메시지를 그대로 공개해도 되는 에러
 *
 * @example
 * // 던지기
 * throw new PublicError("이메일 형식이 올바르지 않습니다");
 *
 * // 에러 핸들링 시
 * if (error instanceof PublicError) {
 *   return res.status(400).json({ message: error.message }); // 메시지 그대로 전달 OK
 * }
 * return res.status(500).json({ message: "서버 오류가 발생했습니다" }); // 일반 에러는 숨김
 */
export class PublicError extends CustomError {
  override name = "PublicError";
  readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * 에러가 PublicError인지 확인하는 타입 가드
 */
export function isPublicError(error: unknown): error is PublicError {
  return error instanceof PublicError;
}
