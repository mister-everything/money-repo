import { Tool, tool } from "ai";
import { z } from "zod";
import { storage } from "./shared";

export const getResultsTool: Tool = tool({
  description: "저장된 API 테스트 결과를 조회합니다.",
  inputSchema: z.object({
    limit: z.number().optional().default(10).describe("최대 조회 개수"),
    success: z.boolean().optional().describe("성공한 테스트만 조회할지 여부"),
  }),
  execute: async ({ limit = 10, success }) => {
    let results = (await storage.get()) ?? [];

    if (success !== undefined) {
      results = results.filter((r) => r.success === success);
    }

    // 최신순으로 정렬
    results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // 제한된 개수만 반환
    const limitedResults = results.slice(0, limit);

    return {
      total: results.length,
      showing: limitedResults.length,
      results: limitedResults,
    };
  },
});
