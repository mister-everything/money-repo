import z from "zod";
// Exa API Types
export type ExaSearchType = "neural" | "fast" | "auto" | "deep";

export type ExaCategory =
  | "company"
  | "research paper"
  | "news"
  | "pdf"
  | "github"
  | "tweet"
  | "personal site"
  | "linkedin profile"
  | "financial report";

export interface ExaSearchRequest {
  query: string;
  type?: ExaSearchType;
  category?: ExaCategory;
  includeDomains?: string[];
  excludeDomains?: string[];
  startPublishedDate?: string;
  endPublishedDate?: string;
  numResults: number;
  contents: {
    text:
      | {
          maxCharacters?: number;
        }
      | boolean;
    livecrawl?: "never" | "always" | "fallback" | "preferred";
    subpages?: number;
    subpageTarget?: string | string[];
  };
}

export interface ExaSearchResult {
  id: string;
  title?: string;
  url: string;
  publishedDate?: string | null;
  author?: string | null;
  text?: string;
  image?: string;
  favicon?: string;
  score?: number;
}

export interface ExaSearchResponse {
  requestId: string;
  resolvedSearchType?: "neural" | "deep";
  results: ExaSearchResult[];
  context?: string;
  autopromptString?: string;
}

export interface ExaContentsRequest {
  ids: string[];
  contents: {
    text:
      | {
          maxCharacters?: number;
        }
      | boolean;
    livecrawl?: "always" | "fallback" | "preferred";
  };
}

export const EXA_SEARCH_TOOL_NAME = "webSearch";

// Minimal schema to reduce tool-binding tokens.
// Keep only the knobs we actually need for fact-checking / sourcing.
export const exaSearchSimpleInputSchema = z.object({
  query: z.string().describe("검색 질문"),
  numResults: z.number().min(1).max(10).default(3).describe("검색 결과 개수"),
  maxCharacters: z
    .number()
    .min(200)
    .max(2000)
    .default(1000)
    .describe("검색 결과당 최대 문자 수"),
});

export type ExaSearchSimpleInput = z.infer<typeof exaSearchSimpleInputSchema>;

export const exaSearchInputSchema = z.object({
  query: z.string().describe("Search query"),
  numResults: z
    .number()
    .min(1)
    .max(100)
    .default(5)
    .describe("Number of search results to return"),
  type: z
    .enum(["auto", "neural", "fast", "deep"])
    .describe(
      "Search type - auto (default), neural, fast, deep (comprehensive with query expansion).",
    )
    .default("auto"),
  category: z
    .enum([
      "company",
      "research paper",
      "news",
      "pdf",
      "github",
      "tweet",
      "personal site",
      "linkedin profile",
      "financial report",
    ])
    .describe("Category to focus the search on")
    .optional(),
  includeDomains: z
    .array(z.string())
    .describe("List of domains to specifically include in search results")
    .optional(),
  excludeDomains: z
    .array(z.string())
    .describe("List of domains to specifically exclude from search results")
    .optional(),
  startPublishedDate: z
    .string()
    .describe("Start published date (ISO 8601 date-time)")
    .optional(),
  endPublishedDate: z
    .string()
    .describe("End published date (ISO 8601 date-time)")
    .optional(),
  maxCharacters: z
    .number()
    .min(100)
    .max(10000)
    .describe("Maximum characters to extract from each result")
    .default(3000),
});

export type ExaSearchInput = z.infer<typeof exaSearchInputSchema>;
