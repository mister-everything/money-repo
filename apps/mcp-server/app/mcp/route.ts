import { userService } from "@service/auth";

import { createMcpHandler } from "mcp-handler";

/**
 * @modelcontextprotocol/sdk module 에서
 * zod4 version 을 마이그레이션 되기 전까지 v3 를 사용합니다.
 */
// import { z } from "zod/v3";

const handler = createMcpHandler((server) => {
  server.registerTool(
    "get-user-list",
    {
      description: "우리 서비스를 이용하는 모든 유저들을 조회합니다.",
      inputSchema: {},
    },
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
}, {});

export { handler as GET, handler as POST, handler as DELETE };
