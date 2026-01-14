import { wait } from "@workspace/util";
import { tool as createTool, Tool } from "ai";
import {
  EXA_SEARCH_TOOL_NAME,
  ExaSearchRequest,
  exaSearchSimpleInputSchema,
} from "./types";

const API_KEY = process.env.EXA_API_KEY;
const BASE_URL = "https://api.exa.ai";

const fetchExa = async (endpoint: string, body: any): Promise<any> => {
  if (!API_KEY) {
    throw new Error("EXA_API_KEY is not configured");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    throw new Error("Invalid Web Search API key");
  }
  if (response.status === 429) {
    throw new Error("Web Search API usage limit exceeded");
  }

  if (!response.ok) {
    throw new Error(
      `Web Search API error: ${response.status} ${response.statusText}`,
    );
  }

  return await response.json();
};

export const exaSearchTool: Tool = createTool({
  name: EXA_SEARCH_TOOL_NAME,
  description:
    "웹을 검색하세요. 검색 기능으로 실시간 웹 검색을 수행합니다. 검색을 통해 정확한 정보를 얻어 답변을 제공합니다.",
  inputSchema: exaSearchSimpleInputSchema,
  execute: async (params) => {
    const searchRequest: ExaSearchRequest = {
      query: params.query,
      type: "auto",
      numResults: params.numResults || 5,
      contents: {
        text: {
          maxCharacters: params.maxCharacters || 1000,
        },
        livecrawl: "preferred",
      },
    };
    await wait(2000); // 애니메이션 효과를 위해 2초 대기
    const result = await fetchExa("/search", searchRequest);

    return {
      ...result,
      guide: `Use the search results to answer the user's question. Summarize the content and ask if they have any additional questions about the topic.`,
    };
  },
});
