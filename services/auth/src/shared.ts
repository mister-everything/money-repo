import z from "zod";

export enum Role {
  USER = "user",
  ADMIN = "admin",
}

export const RoleSchema = z.enum(Object.values(Role));

/** 현재 개인정보 처리방침 버전 */
export const CURRENT_PRIVACY_VERSION = "1.0.0";

/** 닉네임 유효성 검증 규칙 */
export const NICKNAME_RULES = {
  minLength: 2,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9가-힣_]+$/,
} as const;

/** 닉네임 유효성 검증 Zod 스키마 */
export const NicknameSchema = z
  .string()
  .min(NICKNAME_RULES.minLength, `닉네임은 최소 ${NICKNAME_RULES.minLength}자 이상이어야 합니다.`)
  .max(NICKNAME_RULES.maxLength, `닉네임은 최대 ${NICKNAME_RULES.maxLength}자까지 가능합니다.`)
  .regex(NICKNAME_RULES.pattern, "닉네임은 한글, 영문, 숫자, 언더스코어(_)만 사용 가능합니다.");

export type Invitation = {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  usedBy: string | null;
  usedByUser: {
    name: string;
    email: string;
  } | null;
};
