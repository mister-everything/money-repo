import { createHash, randomBytes } from "node:crypto";
import { PublicError } from "@workspace/error";
import { and, count, desc, eq, gte, ilike, isNull, or, sql } from "drizzle-orm";
import { pgDb } from "./db";
import {
  invitationTable,
  policyConsentTable,
  policyVersionTable,
  sessionTable,
  userTable,
} from "./schema";

import { PolicyAgreements, PolicyType, Role, validateNickname } from "./shared";

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

  updateUserRole: async (id: string, role: Role) => {
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

  /**
   * 닉네임 중복 체크
   */
  isNicknameAvailable: async (nickname: string): Promise<boolean> => {
    const [existing] = await pgDb
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.nickname, nickname))
      .limit(1);
    return !existing;
  },

  /**
   * 닉네임 업데이트
   */
  updateNickname: async (userId: string, nickname: string): Promise<void> => {
    // 유효성 검증
    const validation = validateNickname(nickname);
    if (!validation.valid) {
      throw new PublicError(validation.error!);
    }

    // 중복 체크
    const isAvailable = await userService.isNicknameAvailable(nickname);
    if (!isAvailable) {
      throw new PublicError("이미 사용 중인 닉네임입니다.");
    }

    await pgDb
      .update(userTable)
      .set({ nickname })
      .where(and(eq(userTable.id, userId), eq(userTable.isDeleted, false)));
  },

  /**
   * 닉네임과 개인정보 동의를 함께 설정 (온보딩용)
   */
  completeOnboarding: async (
    userId: string,
    nickname: string,
    privacyVersion: string,
    options: ConsentRecordOptions = {},
  ): Promise<void> => {
    // 유효성 검증
    const validation = validateNickname(nickname);
    if (!validation.valid) {
      throw new PublicError(validation.error!);
    }

    // 중복 체크
    const isAvailable = await userService.isNicknameAvailable(nickname);
    if (!isAvailable) {
      throw new PublicError("이미 사용 중인 닉네임입니다.");
    }

    const now = new Date();

    return await pgDb.transaction(async (tx) => {
      await tx
        .update(userTable)
        .set({ nickname })
        .where(and(eq(userTable.id, userId), eq(userTable.isDeleted, false)));

      // 동의 이력 테이블에 기록 (법적 증빙용)
      await tx.insert(policyConsentTable).values({
        id: randomBytes(16).toString("hex"),
        userId,
        version: privacyVersion,
        policyType: "privacy",
        consentedAt: now,
        ipAddress: options.ipAddress ?? null,
        userAgent: options.userAgent ?? null,
      });
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
    return await pgDb.transaction(async (tx) => {
      await tx
        .update(userTable)
        .set({
          name: `User_${userIdHash}`,
          email: `${emailHash}@anonymized.local`,
          nickname: "탈퇴한 사용자",
          image: null,
          isDeleted: true,
          deletedAt: new Date(),
          banned: true,
          banReason: "계정 삭제 요청",
        })
        .where(eq(userTable.id, userId));

      // 모든 세션 삭제
      await tx.delete(sessionTable).where(eq(sessionTable.userId, userId));
    });
  },

  /**
   * 특정 동의 유형의 최신 동의 여부 확인
   */
  hasConsentForType: async (
    userId: string,
    policyType: PolicyType,
    minVersion?: string,
  ): Promise<boolean> => {
    const conditions = [
      eq(policyConsentTable.userId, userId),
      eq(policyConsentTable.policyType, policyType),
    ];

    if (minVersion) {
      conditions.push(gte(policyConsentTable.version, minVersion));
    }

    const [consent] = await pgDb
      .select({ id: policyConsentTable.id })
      .from(policyConsentTable)
      .where(and(...conditions))
      .orderBy(desc(policyConsentTable.consentedAt))
      .limit(1);

    return !!consent;
  },

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

  /**
   * 약관 동의 업데이트 (userTable + policyConsentTable 동시 기록)
   * 세션에 포함되는 policyAgreements 필드를 업데이트하고, 법적 증빙용 이력도 남김
   */
  updatePolicyAgreements: async (
    userId: string,
    agreements: PolicyAgreements,
    options: ConsentRecordOptions = {},
  ): Promise<void> => {
    const now = new Date();

    await pgDb.transaction(async (tx) => {
      // 1. userTable의 policyAgreements 업데이트
      await tx
        .update(userTable)
        .set({ policyAgreements: agreements })
        .where(eq(userTable.id, userId));

      // 2. policyConsentTable에 이력 기록 (법적 증빙용)
      for (const [type, version] of Object.entries(agreements)) {
        if (version) {
          await tx.insert(policyConsentTable).values({
            id: randomBytes(16).toString("hex"),
            userId,
            version,
            policyType: type as PolicyType,
            consentedAt: now,
            ipAddress: options.ipAddress ?? null,
            userAgent: options.userAgent ?? null,
          });
        }
      }
    });
  },

  /**
   * 사용자의 현재 약관 동의 정보 조회
   */
  getPolicyAgreements: async (
    userId: string,
  ): Promise<PolicyAgreements | null> => {
    const [user] = await pgDb
      .select({ policyAgreements: userTable.policyAgreements })
      .from(userTable)
      .where(eq(userTable.id, userId));

    return user?.policyAgreements ?? null;
  },
};
