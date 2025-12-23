import z from "zod";

export enum Role {
  USER = "user",
  ADMIN = "admin",
}

export const RoleSchema = z.enum(Object.values(Role));

export type PolicyType = "privacy" | "terms";
export type ConsentType = "privacy" | "terms" | "marketing";

/** 닉네임 유효성 검증 규칙 */
export const NICKNAME_RULES = {
  minLength: 2,
  maxLength: 16,
  pattern: /^[a-zA-Z0-9가-힣_]+$/,
} as const;

/** 닉네임 유효성 검증 Zod 스키마 */
export const NicknameSchema = z
  .string()
  .min(
    NICKNAME_RULES.minLength,
    `닉네임은 최소 ${NICKNAME_RULES.minLength}자 이상이어야 합니다.`,
  )
  .max(
    NICKNAME_RULES.maxLength,
    `닉네임은 최대 ${NICKNAME_RULES.maxLength}자까지 가능합니다.`,
  )
  .regex(
    NICKNAME_RULES.pattern,
    "닉네임은 한글, 영문, 숫자, 언더스코어(_)만 사용 가능합니다.",
  );

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

export const validateNickname = (
  nickname: string,
): { valid: boolean; error?: string } => {
  if (nickname.length < NICKNAME_RULES.minLength) {
    return {
      valid: false,
      error: `닉네임은 최소 ${NICKNAME_RULES.minLength}자 이상이어야 합니다.`,
    };
  }
  if (nickname.length > NICKNAME_RULES.maxLength) {
    return {
      valid: false,
      error: `닉네임은 최대 ${NICKNAME_RULES.maxLength}자까지 가능합니다.`,
    };
  }
  if (!NICKNAME_RULES.pattern.test(nickname)) {
    return {
      valid: false,
      error: "닉네임은 한글, 영문, 숫자, 언더스코어(_)만 사용 가능합니다.",
    };
  }
  // 금지어 체크 (필요시 확장)
  const forbiddenWords = ["admin", "관리자", "운영자", "탈퇴한", "solves"];
  const lowerNickname = nickname.toLowerCase();
  for (const word of forbiddenWords) {
    if (lowerNickname.includes(word)) {
      return { valid: false, error: "사용할 수 없는 닉네임입니다." };
    }
  }
  return { valid: true };
};
