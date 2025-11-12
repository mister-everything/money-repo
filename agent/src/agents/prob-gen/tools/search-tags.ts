import { openai } from "@ai-sdk/openai";
import { generateObject, tool } from "ai";
import { z } from "zod";
import {
  type TagSuggestionResult,
  tagSuggestionResultSchema,
} from "./shared-schemas";

const MAX_TAG_COUNT = 10;
const MAX_TAG_LENGTH = 8;

const searchTagsInputSchema = z.object({
  description: z
    .string()
    .min(5, "설명은 최소 5자 이상이어야 합니다.")
    .describe("문제집 또는 문제 세트의 주제/상황 설명"),
  desiredTone: z
    .string()
    .optional()
    .describe("표현 톤 또는 타깃 사용자(예: 친근하게, 중학생용)"),
  existingTags: z
    .array(z.string().min(1).max(MAX_TAG_LENGTH))
    .max(MAX_TAG_COUNT)
    .optional()
    .describe("이미 선정된 태그 목록"),
  maxTags: z
    .number()
    .int()
    .min(1)
    .max(MAX_TAG_COUNT)
    .default(MAX_TAG_COUNT)
    .describe("최대 태그 수"),
});

type SearchTagsInput = z.infer<typeof searchTagsInputSchema>;

const tagExamples: Array<{ keyword: string; tags: string[] }> = [
  { keyword: "수학", tags: ["수학", "학습", "중등"] },
  { keyword: "역사", tags: ["역사", "교과", "고등"] },
  { keyword: "회식", tags: ["회식", "친목", "밈"] },
  { keyword: "팀빌딩", tags: ["팀웍", "HR", "워크샵"] },
  { keyword: "밸런스", tags: ["밸런스", "게임", "파티"] },
  { keyword: "넌센스", tags: ["넌센스", "재미", "빠른풀이"] },
  { keyword: "과학", tags: ["과학", "실험", "호기심"] },
  { keyword: "자격증", tags: ["자격증", "시험", "성인"] },
];

function sanitizeTag(tag: string): string {
  const trimmed = tag.replace(/[#\s]/g, "").slice(0, MAX_TAG_LENGTH);
  return trimmed;
}

function deduplicateTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const normalized = tag.trim();
    if (normalized.length === 0) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
    if (result.length >= MAX_TAG_COUNT) break;
  }
  return result;
}

function buildFallbackTags(input: SearchTagsInput): TagSuggestionResult {
  const base: string[] = [];
  const lowerDesc = input.description.toLowerCase();

  for (const example of tagExamples) {
    if (lowerDesc.includes(example.keyword)) {
      base.push(...example.tags);
    }
  }

  if (base.length === 0) {
    base.push("일반", "퀴즈", "재미");
  }

  const sanitized = deduplicateTags(
    base.map((tag) => sanitizeTag(tag)).filter((tag) => tag.length > 0),
  ).slice(0, input.maxTags);

  const tags = sanitized.map((tag) => ({
    tag,
    reason: "키워드 기반 기본 추천",
    confidence: 0.4,
  }));

  return {
    tags,
    summary: "키워드 기반 휴리스틱 태그 추천",
    notes: ["AI 생성 실패로 휴리스틱 결과를 반환했습니다."],
  };
}

function buildPrompt(input: SearchTagsInput): string {
  return `
너는 문제집 태그 추천 전문가야. 아래 요구사항에 맞춘 태그를 최대 ${input.maxTags}개 제안해.

규칙:
- 태그는 8자 이하 한글/영문 조합으로 작성
- 공백과 #은 제거
- 중복되거나 의미가 애매한 단어는 제외
- 태그별 추천 이유를 1문장으로 제공
- 관련 태그가 있다면 1~2개 정도 추가 제안

입력 설명:
- 내용: ${input.description}
- 톤/타깃: ${input.desiredTone ?? "제공되지 않음"}
- 기존 태그: ${input.existingTags?.join(", ") ?? "없음"}

출력 형식(JSON):
{
  "tags": [
    { "tag": "태그명", "reason": "추천 이유", "confidence": 0.85, "related": ["연관1"] }
  ],
  "summary": "추천 요약",
  "notes": ["유의사항"]
}

JSON만 반환해.
  `.trim();
}

export const searchTagsTool = tool({
  description:
    "문제 설명을 기반으로 태그 정책(최대 10개, 8자 이내)을 준수하는 추천 태그 세트를 생성합니다.",
  inputSchema: searchTagsInputSchema,
  execute: async (rawInput) => {
    const input = searchTagsInputSchema.parse(rawInput);
    const prompt = buildPrompt(input);

    try {
      const result = await generateObject({
        model: openai("gpt-4o"),
        schema: tagSuggestionResultSchema,
        prompt,
      });

      const normalizedTags = result.object.tags
        .map((entry) => ({
          ...entry,
          tag: sanitizeTag(entry.tag),
          related: entry.related
            ?.map((tag) => sanitizeTag(tag))
            .filter(Boolean),
        }))
        .filter((entry) => entry.tag.length > 0);

      const deduped = deduplicateTags(
        normalizedTags.map((entry) => entry.tag),
      ).map((tag) => {
        const original = normalizedTags.find((entry) => entry.tag === tag);
        return {
          tag,
          reason: original?.reason,
          confidence: original?.confidence,
          related: original?.related,
        };
      });

      return {
        tags: deduped.slice(0, input.maxTags),
        summary: result.object.summary,
        notes: result.object.notes,
      };
    } catch (error) {
      console.warn("searchTagsTool: fallback due to error", error);
      return buildFallbackTags(input);
    }
  },
});
