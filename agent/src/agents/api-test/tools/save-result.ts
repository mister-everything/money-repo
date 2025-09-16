import { generateUUID } from "@workspace/util";
import { Tool, tool } from "ai";
import { z } from "zod";
import type { ApiRequest, TestResult } from "../types";
import { storage } from "./shared";

export const saveResultTool: Tool = tool({
  description: "API 테스트 결과를 저장합니다.",
  inputSchema: z.object({
    url: z.string().describe("테스트한 URL"),
    method: z
      .enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
      .describe("HTTP 메소드"),
    headers: z.record(z.string(), z.string()).optional().describe("요청 헤더"),
    body: z.string().optional().describe("요청 바디"),
    response: z
      .object({
        status: z.number(),
        statusText: z.string(),
        headers: z.record(z.string(), z.string()),
        data: z.any(),
        responseTime: z.number(),
      })
      .optional()
      .describe("응답 데이터"),
    error: z.string().optional().describe("에러 메시지"),
    success: z.boolean().describe("성공 여부"),
  }),
  execute: async ({
    url,
    method,
    headers,
    body,
    response,
    error,
    success,
  }: {
    url: string;
    method: any;
    headers?: Record<string, string>;
    body?: string;
    response?: {
      status: number;
      statusText: string;
      headers: Record<string, string>;
      data: any;
      responseTime: number;
    };
    error?: string;
    success: boolean;
  }) => {
    const results = (await storage.get()) ?? [];

    const request: ApiRequest = {
      id: generateUUID(),
      url,
      method,
      headers,
      body,
    };

    const testResult: TestResult = {
      id: generateUUID(),
      request,
      response,
      error,
      success,
      createdAt: new Date().toISOString(),
    };

    results.push(testResult);
    await storage.save(results);

    return `테스트 결과가 저장되었습니다. ID: ${testResult.id}`;
  },
});
