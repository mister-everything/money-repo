import z from "zod";

export enum Role {
  USER = "user",
  ADMIN = "admin",
}

export const RoleSchema = z.enum(Object.values(Role));

export type PolicyType = "privacy" | "terms" | "marketing";
export type ConsentType = "privacy" | "terms" | "marketing";

/** 약관 동의 정보 (userTable에 JSON으로 저장) */
export type PolicyAgreements = {
  terms?: string;
  privacy?: string;
  marketing?: string;
};

/** 필수 약관 동의 여부 확인 */
export function hasRequiredPolicyAgreements(
  agreements: PolicyAgreements | null | undefined,
  requiredVersions: { terms: string; privacy: string },
): boolean {
  if (!agreements) return false;
  return (
    agreements.terms === requiredVersions.terms &&
    agreements.privacy === requiredVersions.privacy
  );
}

/** JSON 문자열을 PolicyAgreements로 파싱 */
export function parsePolicyAgreements(
  json: string | null | undefined,
): PolicyAgreements | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as PolicyAgreements;
  } catch {
    return null;
  }
}

/** 닉네임 유효성 검증 규칙 */
export const NICKNAME_RULES = {
  minLength: 2,
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
