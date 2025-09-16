import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const handler = createMcpHandler((server) => {
  server.tool(
    "get-member-list",
    "mr. everything team members 들을 조회합니다.",
    {},
    async () => {
      const memberList = [
        {
          name: "cgoing",
          email: "neo.cgoing@gmail.com",
          profile: "https://ui.shadcn.com/avatars/01.png",
        },
        {
          name: "jack",
          email: "jooc0311@gmail.com",
          profile: "https://ui.shadcn.com/avatars/02.png",
        },
        {
          name: "bob",
          email: "bobob935@gmail.com",
          profile: "https://ui.shadcn.com/avatars/03.png",
        },
        {
          name: "jot san",
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
      name: z.enum(["최성근", "박주창", "조현재", "전인산"]),
    },
    async ({ name }) => {
      const info = {
        최성근: "잘생김",
        박주창: "키큼",
        조현재: "예쁨",
        전인산: "잘 먹음",
      };
      const responseData = info[name]
        ? info[name]
        : `${name}은 없습니다. 다시 입력해주세요.  예시: 최성근, 박주창, 조현재, 전인산 중 하나`;
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
});

export { handler as GET, handler as POST, handler as DELETE };
