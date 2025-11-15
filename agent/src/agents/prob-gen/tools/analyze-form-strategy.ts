import { openai } from "@ai-sdk/openai";
import { generateObject, tool } from "ai";
import { z } from "zod";
import {
  probGenerationFormSchema,
  probGenerationStrategySchema,
  type ProbGenerationForm,
  type ProbGenerationStrategy,
  type WeightedPlanItem,
} from "./shared-schemas";

const DEFAULT_PROBLEM_COUNT = 10;

const analyzeFormInputSchema = z.object({
  form: probGenerationFormSchema,
  problemCount: z.number().int().min(1).max(50).optional(),
  includeAnswers: z.boolean().optional(),
});

type AnalyzeFormInput = z.infer<typeof analyzeFormInputSchema>;

function pickIncludeAnswers({ situation, format }: ProbGenerationForm): boolean {
  const formatSet = new Set(format.map((value) => value.toLowerCase()));
  if (
    formatSet.has("주관식") ||
    formatSet.has("객관식") ||
    formatSet.has("ox 게임") ||
    formatSet.has("ox") ||
    formatSet.has("순위") ||
    formatSet.has("ranking") ||
    formatSet.has("매칭") ||
    formatSet.has("matching")
  ) {
    return true;
  }

  if (situation.includes("교육") || situation.toLowerCase().includes("study")) {
    return true;
  }

  return false;
}

function normalizeWeights(plan: WeightedPlanItem[]): WeightedPlanItem[] {
  if (plan.length === 0) return plan;
  const total = plan.reduce((sum, item) => sum + (item.weight ?? 0), 0);
  if (total === 0) {
    const fallbackWeight = Number((1 / plan.length).toFixed(4));
    return plan.map((item) => ({ ...item, weight: fallbackWeight }));
  }
  return plan.map((item) => ({
    ...item,
    weight: Number(((item.weight ?? 0) / total).toFixed(4)),
  }));
}

function ensureTargetCounts(
  plan: WeightedPlanItem[],
  problemCount: number,
): WeightedPlanItem[] {
  if (plan.length === 0) return plan;
  const normalized = normalizeWeights(plan);
  let remaining = problemCount;
  const assigned = normalized.map((item, index) => {
    const isLast = index === normalized.length - 1;
    if (isLast) {
      return { ...item, targetCount: remaining };
    }
    const count = Math.max(1, Math.round(problemCount * (item.weight ?? 0)));
    remaining -= count;
    return { ...item, targetCount: count };
  });
  return assigned;
}

function buildFallbackStrategy({
  form,
  problemCount,
  includeAnswers,
}: {
  form: ProbGenerationForm;
  problemCount: number;
  includeAnswers: boolean;
}): ProbGenerationStrategy {
  const formatPlan = ensureTargetCounts(
    form.format.map((label) => ({
      label,
      weight: 1 / form.format.length,
      rationale: "선택된 형식을 균등 분배",
    })),
    problemCount,
  );

  const topicPlan = normalizeWeights(
    form.topic.map((label) => ({
      label,
      weight: 1 / form.topic.length,
      rationale: "선택된 소재를 균등하게 반영",
    })),
  );

  const normalizedDifficulty =
    form.difficulty.includes("쉬움") || form.difficulty === "아주쉬움"
      ? "easy"
      : form.difficulty.includes("어려움") && form.difficulty !== "보통"
        ? "hard"
        : "medium";

  return {
    summary: `${form.situation} 상황에서 사용할 ${form.format.join(", ")} 콘텐츠`,
    primaryGoal: `${form.situation} 목적에 맞는 문제집`,
    contentType: form.situation,
    tone: form.situation === "교육" ? "친절하고 학습 친화적" : "역동적이고 재미있게",
    environment: form.platform,
    requirementStatement: form.description || form.topic.join(", "),
    recommendedProblemCount: problemCount,
    includeAnswers,
    formatPlan,
    topicPlan,
    difficulty: {
      userDifficulty: form.difficulty,
      normalized: normalizedDifficulty,
      rationale: "사용자 입력에 따른 기본 매핑",
    },
    participantNotes: `${form.people}이(가) 함께 사용`,
    platformNotes: `플랫폼: ${form.platform}`,
    constraints: [
      {
        label: "기본 스키마 준수",
        description: "문제 수와 형식 분배를 사용자 요구에 맞춰야 함",
      },
    ],
    opportunities: form.topic.map((label) => ({
      label: `${label} 소재 활용`,
      description: `${label}을 중심으로 참신한 아이디어 도출`,
    })),
    suggestedTags: Array.from(
      new Set([
        ...form.topic,
        form.situation,
        form.platform,
        form.ageGroup,
      ]),
    )
      .map((tag) => tag.slice(0, 8))
      .filter((tag) => tag.length > 0),
    additionalNotes: form.description ? [form.description] : undefined,
  };
}

function buildStrategyPrompt({
  form,
  problemCount,
  includeAnswers,
}: {
  form: ProbGenerationForm;
  problemCount: number;
  includeAnswers: boolean;
}) {
  const formatList = form.format.map((value) => `- ${value}`).join("\n");
  const topicList = form.topic.map((value) => `- ${value}`).join("\n");

  return `
너는 문제집/퀴즈 콘텐츠 기획 전문가야. 아래 폼 입력을 바탕으로 AI가 문제를 생성할 수 있도록 전략을 설계해.

출력 형식은 반드시 제공된 JSON 스키마를 따라야 해:
- formatPlan, topicPlan의 weight 합은 각각 1에 가깝도록 설정해.
- targetCount는 정수이며 총합이 ${problemCount}개가 되도록 맞춰.
- includeAnswers 값은 ${includeAnswers}로 유지해.

[폼 입력]
- 인원: ${form.people}
- 상황: ${form.situation}
- 형식:
${formatList}
- 플랫폼: ${form.platform}
- 연령대: ${form.ageGroup}
- 소재:
${topicList}
- 난이도: ${form.difficulty}
- 추가 설명: ${form.description || "없음"}
- 기타 메타데이터: ${
    form.extra
      ? JSON.stringify(form.extra, null, 2)
      : "제공되지 않음"
  }

[전략 수립 시 고려]
1. recommendedProblemCount는 ${problemCount}로 설정
2. includeAnswers는 ${includeAnswers ? "필요" : "불필요"}
3. formatPlan과 topicPlan에 선택된 항목을 모두 포함
4. tone, participantNotes, platformNotes는 사용 맥락을 반영
5. constraints에는 반드시 지켜야 할 규칙을 구체적으로 작성
6. opportunities에는 창의적 확장이 가능한 아이디어 기록

JSON 외 다른 텍스트는 절대 추가하지 마.
  `.trim();
}

export const analyzeFormStrategyTool = tool({
  description:
    "폼 입력을 분석해 문제집 생성 전략(형식/소재 비중, 난이도 해석, 제약 조건 등)을 설계합니다.",
  inputSchema: analyzeFormInputSchema,
  execute: async ({
    form,
    problemCount,
    includeAnswers,
  }: AnalyzeFormInput): Promise<ProbGenerationStrategy> => {
    const normalizedProblemCount = problemCount ?? DEFAULT_PROBLEM_COUNT;
    const normalizedIncludeAnswers =
      includeAnswers ?? pickIncludeAnswers(form);

    try {
      const response = await generateObject({
        model: openai("gpt-4o"),
        schema: probGenerationStrategySchema,
        prompt: buildStrategyPrompt({
          form,
          problemCount: normalizedProblemCount,
          includeAnswers: normalizedIncludeAnswers,
        }),
      });

      const strategy = response.object;

      return {
        ...strategy,
        formatPlan: ensureTargetCounts(strategy.formatPlan, normalizedProblemCount),
        topicPlan: normalizeWeights(strategy.topicPlan),
        recommendedProblemCount: normalizedProblemCount,
        includeAnswers: normalizedIncludeAnswers,
      };
    } catch (error) {
      console.error("문제집 전략 분석 실패, 휴리스틱 전략으로 대체합니다.", error);
      return buildFallbackStrategy({
        form,
        problemCount: normalizedProblemCount,
        includeAnswers: normalizedIncludeAnswers,
      });
    }
  },
});

