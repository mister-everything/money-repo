import { eq, or } from "drizzle-orm";
import { userTable } from ".";
import { pgDb } from "./db";
import { Role } from "./types";
export const userService = {
  getAllUsers: async () => {
    const users = await pgDb.select().from(userTable);
    return users;
  },
  deleteUser: async (id: string) => {
    await pgDb.delete(userTable).where(eq(userTable.id, id));
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
      .where(or(eq(userTable.banned, false), eq(userTable.isAnonymous, false)));
    return users;
  },
  updateUserRole: async (id: string, role: string) => {
    await pgDb.update(userTable).set({ role }).where(eq(userTable.id, id));
  },
  isAdmin: async (id: string) => {
    const [user] = await pgDb
      .select({ role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, id));
    return user?.role === Role.ADMIN;
  },
};
