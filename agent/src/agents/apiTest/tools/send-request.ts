import { Tool, tool } from "ai";
import { z } from "zod";
import type { ApiResponse } from "../types";

export const sendRequestTool: Tool = tool({
  description: "HTTP API 요청을 전송합니다.",
  inputSchema: z.object({
    url: z.string().describe("요청할 URL"),
    method: z
      .enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
      .describe("HTTP 메소드"),
    headers: z.record(z.string(), z.string()).optional().describe("요청 헤더"),
    body: z.string().optional().describe("요청 바디 (JSON 문자열)"),
    timeout: z.number().optional().default(5000).describe("타임아웃 (ms)"),
  }),
  execute: async ({ url, method, headers = {}, body, timeout = 5000 }) => {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const requestOptions: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        signal: controller.signal,
      };

      if (body && method !== "GET" && method !== "HEAD") {
        requestOptions.body = body;
      }

      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      let data: any;

      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } catch {
        data = await response.text();
      }

      const result: ApiResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: (() => {
          const headerObj: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            headerObj[key] = value;
          });
          return headerObj;
        })(),
        data,
        responseTime,
      };

      return {
        success: true,
        response: result,
        message: `요청 성공! 상태코드: ${response.status}, 응답시간: ${responseTime}ms`,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        error: error.message,
        responseTime,
        message: `요청 실패: ${error.message}`,
      };
    }
  },
});
