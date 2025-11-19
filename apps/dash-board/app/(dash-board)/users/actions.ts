"use server";

import { userService } from "@service/auth";
import z from "zod";
import { getUser } from "@/lib/auth/server";
import { safeAction } from "@/lib/protocol/server-action";

export const getUsers = safeAction(
  z.object({
    page: z.number().optional().default(1),
    search: z.string().optional().default(""),
  }),
  async ({ page, search }) => {
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
  },
);
