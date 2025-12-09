/**
 * 모든 커스텀 에러의 베이스 클래스
 */
export class CustomError extends Error {
  override name = "CustomError";

  constructor(message: string) {
    super(message);
  }
}
