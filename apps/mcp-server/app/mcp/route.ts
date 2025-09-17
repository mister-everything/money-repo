import { createMcpHandler } from "mcp-handler";
/**
 * @modelcontextprotocol/sdk module 에서
 * zod4 version 을 마이그레이션 되기 전까지 v3 를 사용합니다.
 */
import { ZodString } from "zod";
import { z } from "zod/v3";

const handler = createMcpHandler((server) => {
  server.tool(
    "get-member-list",
    "mr. everything team members 들을 조회합니다.",
    {},
    async () => {
      const memberList = [
        {
          name: "cgoing",
          koreanName: "최성근",
          email: "neo.cgoing@gmail.com",
          profile: "https://ui.shadcn.com/avatars/01.png",
        },
        {
          name: "jack",
          koreanName: "박주창",
          email: "jooc0311@gmail.com",
          profile: "https://ui.shadcn.com/avatars/02.png",
        },
        {
          name: "bob",
          koreanName: "조현재",
          email: "bobob935@gmail.com",
          profile: "https://ui.shadcn.com/avatars/03.png",
        },
        {
          name: "jot san",
          koreanName: "전인산",
          email: "dlstks15@naver.com",
          profile: "https://ui.shadcn.com/avatars/04.png",
        },
      ];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(memberList),
          },
        ],
      };
    },
  );

  server.tool(
    "get-member-detail",
    "mr. everything team member의 상세 정보를 조회합니다.",
    {
      koreanName: z.string() as unknown as ZodString,
    },
    async ({ koreanName }) => {
      const info = {
        최성근: "잘생김",
        박주창: "키큼",
        조현재: "예쁨",
        전인산: "잘 먹음",
      };
      const responseData = info[koreanName]
        ? info[koreanName]
        : `${koreanName}은 없습니다. 다시 입력해주세요. 예시: 최성근, 박주창, 조현재, 전인산 중 하나`;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(responseData),
          },
        ],
      };
    },
  );
}, {});

export { handler as GET, handler as POST, handler as DELETE };
