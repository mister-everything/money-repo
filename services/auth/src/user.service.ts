import { createHash, randomBytes, randomInt } from "node:crypto";
import { PublicError } from "@workspace/error";
import { and, count, desc, eq, gte, ilike, isNull, or, sql } from "drizzle-orm";
import { pgDb } from "./db";
import {
  invitationTable,
  policyVersionTable,
  privacyConsentTable,
  sessionTable,
  userTable,
} from "./schema";

/** 약관 유형 */
export type PolicyType = "privacy" | "terms";

import { CURRENT_PRIVACY_VERSION, NICKNAME_RULES, Role } from "./shared";

/** 동의 유형 */
export type ConsentType = "privacy" | "terms" | "marketing";

/** 동의 기록 옵션 */
export type ConsentRecordOptions = {
  ipAddress?: string;
  userAgent?: string;
};
export const userService = {
  isSessionValid: async (session: string, userId: string) => {
    const [sessionData] = await pgDb
      .select({ id: sessionTable.id })
      .from(sessionTable)
      .where(
        and(
          eq(sessionTable.id, session),
          eq(sessionTable.userId, userId),
          gte(sessionTable.expiresAt, sql`now()`),
        ),
      );
    if (!sessionData) {
      return false;
    }
    return true;
  },
  createUser: async (user: typeof userTable.$inferInsert) => {
    return await pgDb.insert(userTable).values(user).returning();
  },
  getAllUsers: async () => {
    const users = await pgDb
      .select()
      .from(userTable)
      .where(eq(userTable.isDeleted, false));
    return users;
  },
  deleteUser: async (id: string) => {
    await pgDb
      .update(userTable)
      .set({ deletedAt: new Date(), isDeleted: true })
      .where(eq(userTable.id, id));
  },
  getEnableUsers: async () => {
    const users = await pgDb
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        image: userTable.image,
        createdAt: userTable.createdAt,
        updatedAt: userTable.updatedAt,
        role: userTable.role,
      })
      .from(userTable)
      .where(
        and(
          or(eq(userTable.banned, false), eq(userTable.isAnonymous, false)),
          eq(userTable.isDeleted, false),
        ),
      );
    return users;
  },
  updateUserRole: async (id: string, role: string) => {
    await pgDb
      .update(userTable)
      .set({ role })
      .where(and(eq(userTable.id, id), eq(userTable.isDeleted, false)));
  },
  isAdmin: async (id: string) => {
    const [user] = await pgDb
      .select({ role: userTable.role })
      .from(userTable)
      .where(and(eq(userTable.id, id), eq(userTable.isDeleted, false)));
    return user?.role === Role.ADMIN;
  },
  // User management methods
  getUsersWithPagination: async ({
    page = 1,
    limit = 20,
    search = "",
  }: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(userTable.isDeleted, false)];

    if (search.trim()) {
      whereConditions.push(
        or(
          ilike(userTable.name, `%${search}%`),
          ilike(userTable.email, `%${search}%`),
        ) as any,
      );
    }

    // Get users with pagination
    const users = await pgDb
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        image: userTable.image,
        role: userTable.role,
        banned: userTable.banned,
        banReason: userTable.banReason,
        banExpires: userTable.banExpires,
        emailVerified: userTable.emailVerified,
        createdAt: userTable.createdAt,
        updatedAt: userTable.updatedAt,
      })
      .from(userTable)
      .where(and(...whereConditions))
      .orderBy(desc(userTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ value: totalCount }] = await pgDb
      .select({ value: count() })
      .from(userTable)
      .where(and(...whereConditions));

    return {
      users,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  },
  getUserById: async (id: string) => {
    const [user] = await pgDb
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        image: userTable.image,
        role: userTable.role,
        banned: userTable.banned,
        banReason: userTable.banReason,
        banExpires: userTable.banExpires,
        emailVerified: userTable.emailVerified,
        isAnonymous: userTable.isAnonymous,
        createdAt: userTable.createdAt,
        updatedAt: userTable.updatedAt,
      })
      .from(userTable)
      .where(and(eq(userTable.id, id), eq(userTable.isDeleted, false)));

    return user || null;
  },
  banUser: async (
    id: string,
    reason: string,
    expiresAt?: Date | null,
  ): Promise<void> => {
    await pgDb
      .update(userTable)
      .set({
        banned: true,
        banReason: reason,
        banExpires: expiresAt,
      })
      .where(and(eq(userTable.id, id), eq(userTable.isDeleted, false)));
  },
  unbanUser: async (id: string): Promise<void> => {
    await pgDb
      .update(userTable)
      .set({
        banned: false,
        banReason: null,
        banExpires: null,
      })
      .where(and(eq(userTable.id, id), eq(userTable.isDeleted, false)));
  },
  updateUser: async (
    id: string,
    data: Partial<typeof userTable.$inferInsert>,
  ) => {
    const [updated] = await pgDb
      .update(userTable)
      .set(data)
      .where(and(eq(userTable.id, id), eq(userTable.isDeleted, false)))
      .returning();

    return updated;
  },
  // Invitation methods
  createInvitation: async (createdBy: string) => {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const id = randomBytes(16).toString("hex");

    const [invitation] = await pgDb
      .insert(invitationTable)
      .values({
        id,
        token,
        createdBy,
        expiresAt,
      })
      .returning();

    return invitation;
  },
  validateInvitation: async (token: string) => {
    const [invitation] = await pgDb
      .select()
      .from(invitationTable)
      .where(
        and(
          eq(invitationTable.token, token),
          isNull(invitationTable.usedAt),
          gte(invitationTable.expiresAt, sql`now()`),
        ),
      );

    return invitation || null;
  },
  consumeInvitation: async (token: string, userId: string) => {
    // First validate the invitation
    const invitation = await userService.validateInvitation(token);
    if (!invitation) throw new PublicError("Invalid or expired invitation");
    // Mark invitation as used
    await pgDb
      .update(invitationTable)
      .set({
        usedAt: new Date(),
        usedBy: userId,
      })
      .where(eq(invitationTable.token, token));

    // Grant admin role
    await userService.updateUserRole(userId, Role.ADMIN);
  },
  getInvitationsByUser: async (userId: string) => {
    const invitations = await pgDb
      .select({
        id: invitationTable.id,
        token: invitationTable.token,
        createdAt: invitationTable.createdAt,
        expiresAt: invitationTable.expiresAt,
        usedAt: invitationTable.usedAt,
        usedBy: invitationTable.usedBy,
        usedByUser: {
          name: userTable.name,
          email: userTable.email,
        },
      })
      .from(invitationTable)
      .leftJoin(userTable, eq(invitationTable.usedBy, userTable.id))
      .where(eq(invitationTable.createdBy, userId))
      .orderBy(sql`${invitationTable.createdAt} desc`);

    return invitations;
  },
  getAllInvitations: async () => {
    const invitations = await pgDb
      .select({
        id: invitationTable.id,
        token: invitationTable.token,
        createdAt: invitationTable.createdAt,
        expiresAt: invitationTable.expiresAt,
        usedAt: invitationTable.usedAt,
        usedBy: invitationTable.usedBy,
        usedByUser: {
          name: userTable.name,
          email: userTable.email,
        },
      })
      .from(invitationTable)
      .leftJoin(userTable, eq(invitationTable.usedBy, userTable.id))
      .orderBy(sql`${invitationTable.createdAt} desc`);

    return invitations;
  },

  // ============================================
  // 개인정보 처리방침 관련 메서드
  // ============================================

  /**
   * 랜덤 닉네임 생성 (User#xxxxx 형식)
   * 중복 체크를 수행하고 고유한 닉네임을 반환
   */
  generateNickname: async (): Promise<string> => {
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      const randomNum = randomInt(10000, 99999);
      const nickname = `User#${randomNum}`;

      const [existing] = await pgDb
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.nickname, nickname))
        .limit(1);

      if (!existing) {
        return nickname;
      }
    }
    // 극히 드문 경우: 더 긴 랜덤 문자열 사용
    const fallback = `User#${randomBytes(4).toString("hex")}`;
    return fallback;
  },

  /**
   * 닉네임 유효성 검증
   */
  validateNickname: (nickname: string): { valid: boolean; error?: string } => {
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
    const forbiddenWords = ["admin", "관리자", "운영자", "탈퇴한"];
    const lowerNickname = nickname.toLowerCase();
    for (const word of forbiddenWords) {
      if (lowerNickname.includes(word)) {
        return { valid: false, error: "사용할 수 없는 닉네임입니다." };
      }
    }
    return { valid: true };
  },

  /**
   * 닉네임 중복 체크
   */
  isNicknameAvailable: async (
    nickname: string,
    excludeUserId?: string,
  ): Promise<boolean> => {
    const conditions = [eq(userTable.nickname, nickname)];
    if (excludeUserId) {
      conditions.push(sql`${userTable.id} != ${excludeUserId}`);
    }

    const [existing] = await pgDb
      .select({ id: userTable.id })
      .from(userTable)
      .where(and(...conditions))
      .limit(1);

    return !existing;
  },

  /**
   * 닉네임 업데이트
   */
  updateNickname: async (userId: string, nickname: string): Promise<void> => {
    // 유효성 검증
    const validation = userService.validateNickname(nickname);
    if (!validation.valid) {
      throw new PublicError(validation.error!);
    }

    // 중복 체크
    const isAvailable = await userService.isNicknameAvailable(nickname, userId);
    if (!isAvailable) {
      throw new PublicError("이미 사용 중인 닉네임입니다.");
    }

    await pgDb
      .update(userTable)
      .set({ nickname })
      .where(and(eq(userTable.id, userId), eq(userTable.isDeleted, false)));
  },

  /**
   * 개인정보 동의 여부 확인 (privacyConsentTable 기반)
   */
  hasPrivacyConsent: async (userId: string): Promise<boolean> => {
    const [consent] = await pgDb
      .select({ id: privacyConsentTable.id })
      .from(privacyConsentTable)
      .where(
        and(
          eq(privacyConsentTable.userId, userId),
          eq(privacyConsentTable.consentType, "privacy"),
        ),
      )
      .orderBy(desc(privacyConsentTable.consentedAt))
      .limit(1);

    return !!consent;
  },

  /**
   * 개인정보 동의 기록
   * privacyConsentTable에만 기록 (법적 증빙용)
   */
  recordPrivacyConsent: async (
    userId: string,
    consentType: ConsentType,
    version: string = CURRENT_PRIVACY_VERSION,
    options: ConsentRecordOptions = {},
  ): Promise<void> => {
    const now = new Date();

    // 동의 이력 테이블에 기록
    await pgDb.insert(privacyConsentTable).values({
      id: randomBytes(16).toString("hex"),
      userId,
      version,
      consentType,
      consentedAt: now,
      ipAddress: options.ipAddress ?? null,
      userAgent: options.userAgent ?? null,
    });
  },

  /**
   * 사용자 확장 정보 조회 (닉네임)
   */
  getUserExtendedData: async (userId: string) => {
    const [user] = await pgDb
      .select({
        nickname: userTable.nickname,
      })
      .from(userTable)
      .where(and(eq(userTable.id, userId), eq(userTable.isDeleted, false)));

    return user || null;
  },

  /**
   * 닉네임과 개인정보 동의를 함께 설정 (온보딩용)
   */
  completeOnboarding: async (
    userId: string,
    nickname: string,
    privacyVersion: string = CURRENT_PRIVACY_VERSION,
    options: ConsentRecordOptions = {},
  ): Promise<void> => {
    // 유효성 검증
    const validation = userService.validateNickname(nickname);
    if (!validation.valid) {
      throw new PublicError(validation.error!);
    }

    // 중복 체크
    const isAvailable = await userService.isNicknameAvailable(nickname, userId);
    if (!isAvailable) {
      throw new PublicError("이미 사용 중인 닉네임입니다.");
    }

    const now = new Date();

    // userTable 업데이트 (닉네임만)
    await pgDb
      .update(userTable)
      .set({ nickname })
      .where(and(eq(userTable.id, userId), eq(userTable.isDeleted, false)));

    // 동의 이력 테이블에 기록 (법적 증빙용)
    await pgDb.insert(privacyConsentTable).values({
      id: randomBytes(16).toString("hex"),
      userId,
      version: privacyVersion,
      consentType: "privacy",
      consentedAt: now,
      ipAddress: options.ipAddress ?? null,
      userAgent: options.userAgent ?? null,
    });
  },

  /**
   * 계정 익명화 처리 (계정 삭제 요청 시)
   * 개인정보를 익명화하고 isDeleted를 true로 설정
   */
  anonymizeUser: async (userId: string): Promise<void> => {
    // 사용자 조회
    const [user] = await pgDb
      .select({ email: userTable.email })
      .from(userTable)
      .where(and(eq(userTable.id, userId), eq(userTable.isDeleted, false)));

    if (!user) {
      throw new PublicError("사용자를 찾을 수 없습니다.");
    }

    // 해시 생성
    const userIdHash = createHash("sha256")
      .update(userId)
      .digest("hex")
      .slice(0, 6);
    const emailHash = createHash("sha256")
      .update(userId + user.email)
      .digest("hex")
      .slice(0, 12);

    // 익명화 처리
    await pgDb
      .update(userTable)
      .set({
        name: `User_${userIdHash}`,
        email: `${emailHash}@anonymized.local`,
        nickname: "탈퇴한 사용자",
        image: null,
        isDeleted: true,
        deletedAt: new Date(),
        anonymizedAt: new Date(),
        // 세션 관련 토큰 무효화를 위해 banned도 설정
        banned: true,
        banReason: "계정 삭제 요청",
      })
      .where(eq(userTable.id, userId));

    // 모든 세션 삭제
    await pgDb.delete(sessionTable).where(eq(sessionTable.userId, userId));
  },

  /**
   * 사용자의 개인정보 동의 이력 조회
   */
  getPrivacyConsentHistory: async (userId: string) => {
    const history = await pgDb
      .select({
        id: privacyConsentTable.id,
        version: privacyConsentTable.version,
        consentType: privacyConsentTable.consentType,
        consentedAt: privacyConsentTable.consentedAt,
        ipAddress: privacyConsentTable.ipAddress,
        createdAt: privacyConsentTable.createdAt,
      })
      .from(privacyConsentTable)
      .where(eq(privacyConsentTable.userId, userId))
      .orderBy(desc(privacyConsentTable.consentedAt));

    return history;
  },

  /**
   * 특정 동의 유형의 최신 동의 여부 확인
   */
  hasConsentForType: async (
    userId: string,
    consentType: ConsentType,
    minVersion?: string,
  ): Promise<boolean> => {
    const conditions = [
      eq(privacyConsentTable.userId, userId),
      eq(privacyConsentTable.consentType, consentType),
    ];

    if (minVersion) {
      conditions.push(gte(privacyConsentTable.version, minVersion));
    }

    const [consent] = await pgDb
      .select({ id: privacyConsentTable.id })
      .from(privacyConsentTable)
      .where(and(...conditions))
      .orderBy(desc(privacyConsentTable.consentedAt))
      .limit(1);

    return !!consent;
  },

  // ============================================
  // 약관 버전 관리 메서드
  // ============================================

  /**
   * 특정 버전의 약관 조회
   */
  getPolicyVersion: async (type: PolicyType, version: string) => {
    const [policy] = await pgDb
      .select()
      .from(policyVersionTable)
      .where(
        and(
          eq(policyVersionTable.type, type),
          eq(policyVersionTable.version, version),
        ),
      );

    return policy || null;
  },

  /**
   * 특정 유형의 최신 약관 조회
   */
  getLatestPolicyVersion: async (type: PolicyType) => {
    const [policy] = await pgDb
      .select()
      .from(policyVersionTable)
      .where(eq(policyVersionTable.type, type))
      .orderBy(desc(policyVersionTable.effectiveAt))
      .limit(1);

    return policy || null;
  },

  /**
   * 모든 약관 버전 조회 (관리자용)
   */
  getAllPolicyVersions: async (type?: PolicyType) => {
    const conditions = type ? [eq(policyVersionTable.type, type)] : [];

    const policies = await pgDb
      .select()
      .from(policyVersionTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(policyVersionTable.effectiveAt));

    return policies;
  },

  /**
   * 약관 버전 생성 (관리자용)
   */
  createPolicyVersion: async (data: {
    type: PolicyType;
    version: string;
    title: string;
    content: string;
    effectiveAt: Date;
  }) => {
    const [policy] = await pgDb
      .insert(policyVersionTable)
      .values({
        id: randomBytes(16).toString("hex"),
        ...data,
      })
      .returning();

    return policy;
  },
};
