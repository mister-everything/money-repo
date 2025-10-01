import { userService } from "@service/auth";
import { errorToString } from "@workspace/util";
import { createMcpHandler } from "mcp-handler";
import { ZodString } from "zod";
/**
 * @modelcontextprotocol/sdk module 에서
 * zod4 version 을 마이그레이션 되기 전까지 v3 를 사용합니다.
 */
import { z } from "zod/v3";

const handler = createMcpHandler((server) => {
  server.tool(
    "get-user-list",
    "우리 서비스를 이용하는 모든 유저들을 조회합니다.",
    {},
    async () => {
      const userList = await userService.getAllUsers();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(userList),
          },
        ],
      };
    },
  );
  server.tool(
    "delete-user",
    "우리 서비스를 이용하는 모든 유저들을 조회합니다.",
    { userId: z.string() as unknown as ZodString },
    async ({ userId }) => {
      try {
        await userService.deleteUser(userId);
        return {
          content: [
            {
              type: "text",
              text: "유저 삭제 완료",
            },
          ],
        };
      } catch (error) {
        console.error(error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "유저 삭제 실패",
            },
            {
              type: "text",
              text: errorToString(error),
            },
          ],
        };
      }
    },
  );
  server.tool(
    "update-user-role",
    "우리 서비스를 이용하는 유저의 Role을 업데이트 합니다.",
    {
      userId: z.string() as unknown as ZodString,
      role: z.enum(["user", "admin"]) as unknown as ZodString,
    },
    async ({ userId, role }) => {
      try {
        await userService.updateUserRole(userId, role);
        return {
          content: [
            {
              type: "text",
              text: "유저 업데이트 완료",
            },
          ],
        };
      } catch (error) {
        console.error(error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "유저 업데이트 실패",
            },
            {
              type: "text",
              text: errorToString(error),
            },
          ],
        };
      }
    },
  );
}, {});

export { handler as GET, handler as POST, handler as DELETE };
