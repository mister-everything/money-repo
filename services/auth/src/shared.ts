import { badWords, nicknameForbiddenWords } from "@workspace/util";
import z from "zod";

export enum Role {
  USER = "user",
  ADMIN = "admin",
}

export const RoleSchema = z.enum(Object.values(Role));

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

export interface PolicyVersion {
  id: string;
  type: string;
  version: string;
  title: string;
  content: string;
  isRequired: boolean;
  effectiveAt: Date;
}

export const Policy = [
  {
    value: "privacy",
    label: "개인정보 처리방침",
  },
  {
    value: "terms",
    label: "이용약관",
  },
  {
    value: "community",
    label: "커뮤니티 가이드라인",
  },
  {
    value: "marketing",
    label: "마케팅 정보 수신 동의",
  },
] as const;

export type PolicyType = (typeof Policy)[number]["value"];

export const PolicyVersionSchema = z
  .string()
  .min(1)
  .max(10)
  .regex(/^\d+\.\d+\.\d+$/, "버전 형식이 올바르지 않습니다. (예: 1.0.0)");

/** 닉네임 유효성 검증 규칙 */
export const NICKNAME_RULES = {
  minLength: 3,
  maxLength: 16,
  pattern: /^[a-zA-Z0-9가-힣]+$/,
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
    "닉네임은 한글, 영문, 숫자 만 사용 가능합니다.",
  );

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
      error: "닉네임은 한글, 영문, 숫자 만 사용 가능합니다.",
    };
  }
  // 금지어 체크 (필요시 확장)
  const forbiddenWords = [...nicknameForbiddenWords, ...badWords];
  const lowerNickname = nickname.toLowerCase();
  for (const word of forbiddenWords) {
    if (lowerNickname.includes(word)) {
      return {
        valid: false,
        error: `사용할 수 없는 단어가 포함되어 있습니다. (${word})`,
      };
    }
  }
  return { valid: true };
};
