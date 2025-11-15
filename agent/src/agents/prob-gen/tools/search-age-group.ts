import { openai } from "@ai-sdk/openai";
import { generateObject, tool } from "ai";
import { z } from "zod";
import {
  ageBandSchema,
  ageClassificationSchema,
  type AgeBand,
  type AgeClassification,
} from "./shared-schemas";

const AGE_KEYWORDS: Record<AgeBand, string[]> = {
  전체: ["전연령", "모두", "family", "all ages"],
  유아: ["유아", "미취학", "4세", "5세", "6세", "7세", "놀이", "그림책"],
  "초등 저학년": ["초1", "초2", "초3", "저학년", "기초"],
  "초등 고학년": ["초4", "초5", "초6", "고학년", "심화 교과"],
  중등: ["중학생", "중1", "중2", "중3", "내신", "중등"],
  고등: ["고등", "수능", "입시", "심화", "고1", "고2", "고3"],
  성인: ["성인", "직장인", "대학생", "자격증", "업무", "HR", "팀빌딩", "재테크"],
  시니어: ["시니어", "노년", "어르신", "치매", "인지", "시니어 케어"],
};

const searchAgeInputSchema = z.object({
  description: z
    .string()
    .min(5)
    .describe("문제집의 타깃 학습자 또는 사용 상황 설명"),
  currentDifficulty: z
    .string()
    .optional()
    .describe("현재 추정 난이도 또는 정답률 힌트"),
  preferredAgeBand: ageBandSchema.optional(),
});

type SearchAgeInput = z.infer<typeof searchAgeInputSchema>;

function determineFallbackAge(input: SearchAgeInput): AgeClassification {
  const normalizedText = `${input.description} ${input.currentDifficulty ?? ""}`.toLowerCase();

  const matches: AgeBand[] = [];
  for (const [band, keywords] of Object.entries(AGE_KEYWORDS) as Array<
    [AgeBand, string[]]
  >) {
    if (
      keywords.some((keyword) =>
        normalizedText.includes(keyword.toLowerCase()),
      )
    ) {
      matches.push(band);
    }
  }

  const primary =
    input.preferredAgeBand ??
    matches[0] ??
    (input.currentDifficulty?.includes("고난도") ? "성인" : "전체");

  const secondary = matches.filter((band) => band !== primary);

  return {
    primary,
    secondary: secondary.length ? secondary : undefined,
    reasoning: "키워드 기반 휴리스틱 분류",
    contentNotes: [
      "AI 분류 실패로 기본 규칙을 적용했습니다.",
      "상세한 대상 정보를 입력하면 더 정확한 추천이 가능합니다.",
    ],
  };
}

function buildPrompt(input: SearchAgeInput): string {
  return `
너는 문제집 타깃 연령 분류 전문가야. 아래 설명을 기반으로 가장 적합한 연령대를 선택해.

선택 가능한 연령대: 전체, 유아, 초등 저학년, 초등 고학년, 중등, 고등, 성인, 시니어

규칙:
- primary는 하나만 선택
- secondary는 보조 대상이 있다면 0~3개 정도 선택
- reasoning에는 왜 해당 연령인지 구체적으로 작성
- contentNotes에는 콘텐츠 구성 시 주의할 점이나 팁을 bullet 형식으로 포함

입력 설명:
- 내용: ${input.description}
- 현재 난이도 정보: ${input.currentDifficulty ?? "없음"}
- 선호 연령대: ${input.preferredAgeBand ?? "없음"}

출력(JSON):
{
  "primary": "중등",
  "secondary": ["고등"],
  "reasoning": "...",
  "contentNotes": ["...", "..."]
}

JSON만 반환해.
  `.trim();
}

export const searchAgeGroupTool = tool({
  description:
    "문제집 설명을 분석해 사전 정의된 연령 밴드(전체~시니어) 중 주 타깃과 보조 타깃을 추천합니다.",
  inputSchema: searchAgeInputSchema,
  execute: async (rawInput) => {
    const input = searchAgeInputSchema.parse(rawInput);
    const prompt = buildPrompt(input);

    try {
      const { object } = await generateObject({
        model: openai("gpt-4o"),
        schema: ageClassificationSchema,
        prompt,
      });

      const primary = object.primary ?? input.preferredAgeBand ?? "전체";
      const secondary = object.secondary?.filter(
        (band) => band !== primary,
      );

      return {
        primary,
        secondary: secondary && secondary.length ? secondary : undefined,
        reasoning: object.reasoning,
        contentNotes: object.contentNotes,
      };
    } catch (error) {
      console.warn("searchAgeGroupTool: fallback due to error", error);
      return determineFallbackAge(input);
    }
  },
});

