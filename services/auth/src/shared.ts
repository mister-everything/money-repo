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

/** 유입 경로 옵션 (최초 1회 수집) */
export const ReferralSources = [
  { value: "search", label: "검색" },
  { value: "sns", label: "SNS" },
  { value: "friend", label: "지인 추천" },
  { value: "ad", label: "광고" },
  { value: "community", label: "커뮤니티/블로그" },
  { value: "other", label: "기타" },
] as const;

export type ReferralSourceType = (typeof ReferralSources)[number]["value"];

/** 직업 옵션 (최초 1회 수집) */
export const Occupations = [
  { value: "student", label: "학생" },
  { value: "student_univ", label: "대학생" },
  { value: "employee", label: "직장인" },
  { value: "business", label: "사업가/자영업" },
  { value: "educator", label: "교육자/강사" },
  { value: "other", label: "기타" },
] as const;

export type OccupationType = (typeof Occupations)[number]["value"];

/**
 * publicId를 Base36 (0-9, A-Z) 형식으로 변환하여 짧게 표시
 * @example displayPublicId(1) → "1"
 * @example displayPublicId(35) → "Z"
 * @example displayPublicId(1000) → "RS"
 * @example displayPublicId(10000) → "7PS"
 */
export const displayPublicId = (publicId: number): string => {
  return publicId.toString(36).toUpperCase();
};

/**
 * Base36 형식의 문자열을 다시 publicId(숫자)로 변환
 * @example parsePublicId("7PS") → 10000
 * @returns 유효하지 않은 경우 null
 */
export const parsePublicId = (display: string): number | null => {
  const parsed = Number.parseInt(display, 36);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
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

export const validateComment = (
  text?: string,
): { valid: boolean; error?: string } => {
  if (!text) return { valid: false, error: "댓글을 입력해주세요." };
  if (text.length > 280)
    return { valid: false, error: "댓글은 최대 280자까지 입력할 수 있습니다." };
  const lowerText = text.toLowerCase();
  for (const word of badWords) {
    if (lowerText.includes(word)) {
      return { valid: false, error: `비속어가 포함되어 있습니다: ${word}` };
    }
  }
  return { valid: true };
};
