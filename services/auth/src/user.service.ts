import { createHash, randomBytes } from "node:crypto";
import { PublicError } from "@workspace/error";
import { and, count, desc, eq, gte, ilike, isNull, or, sql } from "drizzle-orm";
import { pgDb } from "./db";
import { invitationTable, sessionTable, userTable } from "./schema";

import { Role, validateNickname } from "./shared";

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
};
