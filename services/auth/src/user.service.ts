import { and, eq, or } from "drizzle-orm";
import { pgDb } from "./db";
import { userTable } from "./schema";
import { Role } from "./types";
export const userService = {
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
};
