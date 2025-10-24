"use server";

import { userService } from "@service/auth";
import { getUser } from "@/lib/auth/server";

export async function getUsers(page: number = 1, search: string = "") {
  await getUser(); // Check if user is authenticated

  const result = await userService.getUsersWithPagination({
    page,
    limit: 20,
    search,
  });

  return {
    users: result.users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      banExpires: user.banExpires?.toISOString() || null,
    })),
    totalCount: result.totalCount,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}
