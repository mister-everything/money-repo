import { eq } from "drizzle-orm";
import { userTable } from ".";
import { pgDb } from "./db";

export const userService = {
  getAllUsers: async () => {
    const users = await pgDb.select().from(userTable);
    return users;
  },
  deleteUser: async (id: string) => {
    await pgDb.delete(userTable).where(eq(userTable.id, id));
  },
};
