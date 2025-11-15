import { openai } from "@ai-sdk/openai";
import { generateObject, tool } from "ai";
import { z } from "zod";
import {
  type TopicClassification,
  topicClassificationSchema,
} from "./shared-schemas";

const TOPIC_MAP: Record<string, string[]> = {
  "일반 상식": ["기초 상식", "넌센스", "일상 잡학"],
  "학교 교과목": ["국어", "수학", "영어", "사회", "과학", "예체능"],
  시사: ["국내 정치/사회", "국제/외교", "문학/철학", "전통문화"],
  "역사/문화/예술": ["한국사", "세계사", "미술사", "음악사", "문학/철학"],
  "영화/음악": ["K-POP", "팝/클래식", "영화/드라마", "웹툰/애니메이션"],
  "업무/직무": [
    "HR/경영",
    "비즈니스매너",
    "직장생활",
    "마케팅/홍보",
    "IT/개발",
  ],
  "MBTI/성향": ["MBTI 유형", "애니어그램", "심리테스트", "가치관"],
  "밈/트렌드": ["유행어", "SNS트렌드", "밸런스게임"],
  "취미/라이프스타일": [
    "여행",
    "스포츠",
    "요리",
    "패션/뷰티",
    "반려동물",
    "건강/웰빙",
  ],
  "과학/기술/IT": ["인공지능(AI)", "우주/천문학", "생명과학", "최신 IT 트렌드"],
};

const fallbackPrimary = "일반 상식";
const fallbackSecondary = "기초 상식";

const searchTopicInputSchema = z.object({
  description: z
    .string()
    .min(5, "설명은 최소 5자 이상이어야 합니다.")
    .describe("문제 혹은 문제집의 소재/배경 설명"),
  preferredMainCategory: z
    .string()
    .optional()
    .describe("선호하는 대분류 카테고리"),
  preferredSubCategory: z
    .string()
    .optional()
    .describe("선호하는 중분류 카테고리"),
});

type SearchTopicInput = z.infer<typeof searchTopicInputSchema>;

const topicOptionsSummary = Object.entries(TOPIC_MAP)
  .map(([main, subs]) => `- ${main}: ${subs.join(", ")}`)
  .join("\n");

function matchFallbackTopic(input: SearchTopicInput): TopicClassification {
  const text =
    `${input.description} ${input.preferredMainCategory ?? ""} ${input.preferredSubCategory ?? ""}`.toLowerCase();
  let main = fallbackPrimary;
  let sub = fallbackSecondary;

  for (const [key, subs] of Object.entries(TOPIC_MAP)) {
    if (text.includes(key.replace(/[\/\s]/g, "").toLowerCase())) {
      main = key;
      sub = subs[0] ?? fallbackSecondary;
      break;
    }
    for (const child of subs) {
      if (text.includes(child.replace(/[\/\s]/g, "").toLowerCase())) {
        main = key;
        sub = child;
        break;
      }
    }
  }

  if (input.preferredMainCategory && TOPIC_MAP[input.preferredMainCategory]) {
    main = input.preferredMainCategory;
    if (
      input.preferredSubCategory &&
      TOPIC_MAP[main].includes(input.preferredSubCategory)
    ) {
      sub = input.preferredSubCategory;
    } else {
      sub = TOPIC_MAP[main][0] ?? sub;
    }
  }

  return {
    mainCategory: main,
    subCategory: sub,
    reason: "키워드 기반 기본 분류",
    confidence: 0.4,
    alternatives: TOPIC_MAP[main]?.filter((item) => item !== sub).slice(0, 3),
    autoTags: [main, sub].filter(Boolean).map((value) => value.slice(0, 8)),
  };
}

function buildPrompt(input: SearchTopicInput): string {
  return `
너는 문제집 카테고리 분류 전문가야. 아래 설명을 참고해 사전 정의된 대분류/중분류 목록에서 가장 알맞은 조합을 골라.

사용 가능한 대분류/중분류:
${topicOptionsSummary}

규칙:
- mainCategory는 반드시 위 목록 중 하나
- subCategory는 선택된 mainCategory의 하위 항목 중 하나
- 대분류/중분류 이유를 구체적으로 1문장 이상 작성
- 연관 태그(autoTags)는 8자 이내로 2~4개 정도 제안

입력 설명:
- 내용: ${input.description}
- 선호 대분류: ${input.preferredMainCategory ?? "없음"}
- 선호 중분류: ${input.preferredSubCategory ?? "없음"}

출력(JSON):
{
  "mainCategory": "학교 교과목",
  "subCategory": "수학",
  "reason": "...",
  "confidence": 0.85,
  "alternatives": ["과학"],
  "autoTags": ["수학", "내신"]
}

JSON만 반환해.
  `.trim();
}

export const searchTopicTool = tool({
  description:
    "문제 설명을 바탕으로 사전 정의된 대분류/중분류를 선택하고 태그 후보를 생성합니다.",
  inputSchema: searchTopicInputSchema,
  execute: async (rawInput) => {
    const input = searchTopicInputSchema.parse(rawInput);
    const prompt = buildPrompt(input);

    try {
      const { object } = await generateObject({
        model: openai("gpt-4o"),
        schema: topicClassificationSchema,
        prompt,
      });

      const mainCategory = TOPIC_MAP[object.mainCategory]
        ? object.mainCategory
        : fallbackPrimary;
      const subCategory = TOPIC_MAP[mainCategory]?.includes(object.subCategory)
        ? object.subCategory
        : (TOPIC_MAP[mainCategory]?.[0] ?? fallbackSecondary);

      return {
        mainCategory,
        subCategory,
        reason: object.reason,
        confidence: object.confidence,
        alternatives: object.alternatives?.filter((value) =>
          TOPIC_MAP[mainCategory]?.includes(value),
        ),
        autoTags: object.autoTags
          ?.map((tag) => tag.replace(/\s+/g, "").slice(0, 8))
          .filter((tag) => tag.length > 0),
      };
    } catch (error) {
      console.warn("searchTopicTool: fallback due to error", error);
      return matchFallbackTopic(input);
    }
  },
});
