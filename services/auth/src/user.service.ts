import { randomBytes } from "node:crypto";
import { and, eq, gte, isNull, or, sql } from "drizzle-orm";
import { pgDb } from "./db";
import { invitationTable, sessionTable, userTable } from "./schema";
import { Role } from "./shared";
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
    if (!invitation) {
      return false;
    }

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

    return true;
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
};
