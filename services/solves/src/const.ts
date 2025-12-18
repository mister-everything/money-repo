export const SCHEMA_NAME = "solves";
export const SERVICE_NAME = "solves-service";

/**
 * 초기 크레딧 밸런스 (신규 지갑 생성 시)
 * 환경 변수로 설정 가능, 기본값: 5
 */
export const INITIAL_CREDIT_BALANCE = Number(
  process.env.INITIAL_CREDIT_BALANCE || "2",
);
