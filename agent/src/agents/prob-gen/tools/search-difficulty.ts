import { openai } from "@ai-sdk/openai";
import { generateObject, tool } from "ai";
import { z } from "zod";
import {
  extendedDifficultySchema,
  type ExtendedDifficulty,
} from "./shared-schemas";

const difficultyLabelMap: Record<string, ExtendedDifficulty["level"]> = {
  "아주 쉬움": "very_easy",
  쉬움: "easy",
  보통: "medium",
  어려움: "hard",
  "아주 어려움": "very_hard",
};

const difficultyRanges: Record<ExtendedDifficulty["level"], [number, number]> = {
  very_easy: [0.9, 1],
  easy: [0.7, 0.9],
  medium: [0.4, 0.7],
  hard: [0.2, 0.4],
  very_hard: [0, 0.2],
};

const searchDifficultyInputSchema = z.object({
  description: z
    .string()
    .min(5)
    .describe("문제의 난이도를 판단할 수 있는 설명"),
  targetLearner: z
    .string()
    .optional()
    .describe("학습자 수준/배경 (예: 중학교 2학년)"),
  expectedCorrectRateHint: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("예상 정답률 힌트 (0~1)"),
});

type SearchDifficultyInput = z.infer<typeof searchDifficultyInputSchema>;

function guessDifficultyLabel(input: SearchDifficultyInput): ExtendedDifficulty {
  const hint = input.expectedCorrectRateHint;
  if (typeof hint === "number") {
    if (hint >= 0.9) return buildDifficulty("very_easy", hint, "제공된 정답률 힌트 기반");
    if (hint >= 0.7) return buildDifficulty("easy", hint, "제공된 정답률 힌트 기반");
    if (hint >= 0.4) return buildDifficulty("medium", hint, "제공된 정답률 힌트 기반");
    if (hint >= 0.2) return buildDifficulty("hard", hint, "제공된 정답률 힌트 기반");
    return buildDifficulty("very_hard", hint, "제공된 정답률 힌트 기반");
  }

  const text = `${input.description} ${input.targetLearner ?? ""}`.toLowerCase();

  if (text.includes("전문") || text.includes("자격증") || text.includes("고난도")) {
    return buildDifficulty("hard", 0.3, "키워드 기반 추정");
  }
  if (text.includes("입시") || text.includes("수능") || text.includes("대학")) {
    return buildDifficulty("hard", 0.25, "키워드 기반 추정");
  }
  if (text.includes("중학생") || text.includes("중등")) {
    return buildDifficulty("medium", 0.55, "키워드 기반 추정");
  }
  if (text.includes("초등") || text.includes("기초")) {
    return buildDifficulty("easy", 0.75, "키워드 기반 추정");
  }
  if (text.includes("유아") || text.includes("놀이")) {
    return buildDifficulty("very_easy", 0.92, "키워드 기반 추정");
  }

  return buildDifficulty("medium", 0.6, "기본 추정");
}

function buildDifficulty(
  level: ExtendedDifficulty["level"],
  expectedAccuracy?: number,
  rationale?: string,
): ExtendedDifficulty {
  const [min, max] = difficultyRanges[level];
  const accuracy =
    expectedAccuracy !== undefined
      ? Math.min(Math.max(expectedAccuracy, min), max)
      : (min + max) / 2;

  const label = Object.entries(difficultyLabelMap).find(
    ([, value]) => value === level,
  )?.[0];

  return {
    level,
    label: label ?? "보통",
    expectedAccuracy: Number(accuracy.toFixed(2)),
    rationale,
    preparationTips: [
      "문제 서술 시 예시와 힌트를 적절히 조정하세요.",
      "정답률 목표에 맞게 풀이 시간을 설계하세요.",
    ],
  };
}

function buildPrompt(input: SearchDifficultyInput): string {
  return `
너는 문제 난이도 평가 전문가야. 아래 설명을 바탕으로 예상 정답률과 난이도를 판단해.

난이도 레벨: 아주 쉬움, 쉬움, 보통, 어려움, 아주 어려움

규칙:
- level은 very_easy, easy, medium, hard, very_hard 중 하나
- label에는 위 한글 표현을 사용
- expectedAccuracy는 0~1 사이 값 (소수점 2자리)
- rationale에는 근거를 1~2문장 작성
- preparationTips에는 2~3개의 튜닝 팁 제공

입력 설명:
- 내용: ${input.description}
- 학습자: ${input.targetLearner ?? "미정"}
- 정답률 힌트: ${input.expectedCorrectRateHint ?? "없음"}

출력(JSON):
{
  "level": "medium",
  "label": "보통",
  "expectedAccuracy": 0.55,
  "rationale": "...",
  "preparationTips": ["...", "..."]
}

JSON만 반환해.
  `.trim();
}

export const searchDifficultyTool = tool({
  description:
    "문제 설명과 학습자 정보를 기반으로 예상 정답률과 난이도 레벨(아주 쉬움~아주 어려움)을 추정합니다.",
  inputSchema: searchDifficultyInputSchema,
  execute: async (rawInput) => {
    const input = searchDifficultyInputSchema.parse(rawInput);
    const prompt = buildPrompt(input);

    try {
      const { object } = await generateObject({
        model: openai("gpt-4o"),
        schema: extendedDifficultySchema,
        prompt,
      });

      const normalizedLevel =
        object.level ??
        difficultyLabelMap[object.label as keyof typeof difficultyLabelMap];

      if (!normalizedLevel) {
        return guessDifficultyLabel(input);
      }

      return {
        level: normalizedLevel,
        label: object.label,
        expectedAccuracy: object.expectedAccuracy,
        rationale: object.rationale,
        preparationTips: object.preparationTips,
      };
    } catch (error) {
      console.warn("searchDifficultyTool: fallback due to error", error);
      return guessDifficultyLabel(input);
    }
  },
});

