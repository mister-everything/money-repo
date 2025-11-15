import { openai } from "@ai-sdk/openai";
import { generateObject, tool } from "ai";
import { z } from "zod";
import {
  probGenerationFormSchema,
  probGenerationStrategySchema,
  promptPackageSchema,
  type ProbGenerationForm,
  type ProbGenerationStrategy,
  type PromptPackage,
  type WeightedPlanItem,
} from "./shared-schemas";

const buildPromptInputSchema = z.object({
  form: probGenerationFormSchema,
  strategy: probGenerationStrategySchema,
  problemCount: z.number().int().min(1).max(50).optional(),
  includeAnswers: z.boolean().optional(),
});

function resolveProblemCount(
  inputCount: number | undefined,
  strategy: ProbGenerationStrategy,
): number {
  return inputCount ?? strategy.recommendedProblemCount;
}

function resolveIncludeAnswers(
  includeAnswers: boolean | undefined,
  strategy: ProbGenerationStrategy,
): boolean {
  return typeof includeAnswers === "boolean"
    ? includeAnswers
    : strategy.includeAnswers;
}

function planToText(plan: WeightedPlanItem[]): string {
  return plan
    .map((item) => {
      const weightPercent =
        typeof item.weight === "number"
          ? `${Math.round(item.weight * 100)}%`
          : undefined;
      const count = item.targetCount != null ? `${item.targetCount}문항` : undefined;
      const pieces = [
        `- ${item.label}`,
        item.problemType ? `(type: ${item.problemType})` : undefined,
        weightPercent,
        count,
      ]
        .filter(Boolean)
        .join(" ");
      const rationale = item.rationale ? `    • ${item.rationale}` : undefined;
      return rationale ? `${pieces}\n${rationale}` : pieces;
    })
    .join("\n");
}

function listToBullets(values: string[] | undefined): string {
  if (!values || values.length === 0) return "- (없음)";
  return values.map((value) => `- ${value}`).join("\n");
}

function buildSchemaReminder(includeAnswers: boolean): string {
  return `
필수 스키마:
- ownerId: "USER_ID_PLACEHOLDER"
- title: 주제를 명확히 드러내는 1줄 제목
- description: 문제집 소개 1~2문장
- isPublic: 기본 false
- tags: 3~5개의 핵심 키워드
- blocks: 문제 순서대로 order 0부터 증가
  - type: default | mcq | ranking | ox | matching
  - question: 문제 문장
  - content: 각 타입에 맞는 구조
  - ${
    includeAnswers
      ? "answer: 정답 정보를 타입에 맞게 채워"
      : "answer: 생성하지 마"
  }
  `.trim();
}

function defaultExample(): PromptPackage["examples"] {
  const example = {
    title: "샘플 MCQ 문제",
    description: "기본 구조를 보여주는 예시",
    json: JSON.stringify(
      {
        ownerId: "USER_ID_PLACEHOLDER",
        title: "샘플 문제집",
        description: "참여자가 즐겁게 풀 수 있는 샘플 문제집",
        isPublic: false,
        tags: ["샘플", "문제집", "예시"],
        blocks: [
          {
            type: "mcq",
            question: "다음 중 커피 종류가 아닌 것은?",
            content: {
              type: "mcq",
              question: "다음 중 커피 종류가 아닌 것은?",
              options: [
                { type: "text", text: "아메리카노" },
                { type: "text", text: "라떼" },
                { type: "text", text: "카푸치노" },
                { type: "text", text: "슬러시" },
              ],
            },
            answer: {
              type: "mcq",
              answer: [3],
            },
            order: 0,
          },
        ],
      },
      null,
      2,
    ),
  };

  return [example];
}

function composePrompt({
  form,
  strategy,
  problemCount,
  includeAnswers,
}: {
  form: ProbGenerationForm;
  strategy: ProbGenerationStrategy;
  problemCount: number;
  includeAnswers: boolean;
}): string {
  return `
너는 전문 문제집/퀴즈 플래너야. 아래 전략과 요구사항을 충실히 반영해서 AI가 JSON 문제집을 생성하도록 가이드라인을 설계해.

[핵심 목표]
- ${strategy.primaryGoal}
- 콘텐츠 타입: ${strategy.contentType}
- 추천 문제 수: ${problemCount}개
- 정답 포함: ${includeAnswers ? "예" : "아니오"}
- 난이도 해석: ${strategy.difficulty.normalized} (${strategy.difficulty.rationale ?? "사용자 요청 기반"})

[형식 구성 비율]
${planToText(strategy.formatPlan)}

[소재/토픽 비율]
${planToText(strategy.topicPlan)}

[톤 & 참가자/플랫폼 참고]
- 톤: ${strategy.tone ?? "친근하고 명료하게"}
- 참가자 메모: ${strategy.participantNotes ?? "특이사항 없음"}
- 플랫폼 메모: ${strategy.platformNotes ?? "특이사항 없음"}

[중요 제약]
${listToBullets((strategy.constraints ?? []).map((c) => c.description ?? c.label))}

[추가 기회]
${listToBullets((strategy.opportunities ?? []).map((c) => c.description ?? c.label))}

[태그 가이드]
${strategy.suggestedTags.map((tag) => `- ${tag}`).join("\n")}

[사용자 상세 설명]
${form.description && form.description.trim().length > 0 ? form.description.trim() : "- (없음)"}

[JSON 스키마 주의사항]
${buildSchemaReminder(includeAnswers)}

위 정보를 종합해서 모델이 그대로 따라 할 수 있는 상세 지시문을 작성해. 출력은 가독성 좋은 한국어 설명으로 작성하되, 마지막에 "JSON만 반환" 지시를 명확히 포함시켜. 불필요한 서론 없이 바로 지시문을 제공해.
  `.trim();
}

function fallbackPromptPackage(params: {
  form: ProbGenerationForm;
  strategy: ProbGenerationStrategy;
  problemCount: number;
  includeAnswers: boolean;
}): PromptPackage {
  const prompt = composePrompt(params);

  return {
    prompt,
    summary: `${params.strategy.summary} - ${params.problemCount}문항 프롬프트`,
    guardrails: [
      "반드시 JSON만 최종 출력",
      params.includeAnswers
        ? "모든 문제에 answer 필드를 포함"
        : "어떠한 문제에도 answer 필드를 포함하지 말 것",
      "blocks 배열 길이가 요청된 문제 수와 정확히 일치해야 함",
      "order는 0부터 시작해서 1씩 증가",
    ],
    checklist: [
      "title과 description은 한글로 자연스럽게 작성",
      "tags는 최소 3개, 최대 5개",
      "각 문제의 question은 템포감 있게 작성",
      "topic 비중과 format 비중을 전략에 맞게 유지",
    ],
    examples: defaultExample(),
    metadata: {
      strategySummary: params.strategy.summary,
      problemCount: params.problemCount,
      includeAnswers: params.includeAnswers,
    },
  };
}

function buildPromptLLMPrompt(params: {
  form: ProbGenerationForm;
  strategy: ProbGenerationStrategy;
  problemCount: number;
  includeAnswers: boolean;
  fallback: PromptPackage;
}): string {
  return `
너는 시스템 프롬프트 작성 전문가야. 아래 정보를 바탕으로 문제집 JSON을 생성하기 위한 상세 프롬프트를 만들어.

[입력 폼]
${JSON.stringify(params.form, null, 2)}

[생성 전략]
${JSON.stringify(params.strategy, null, 2)}

[기본 프롬프트 초안]
${params.fallback.prompt}

위 초안을 참고하되, 전략과 폼 정보를 더욱 정확히 반영하도록 다듬어. 특히 형식/토픽 비중, 난이도, 참가자 메모 등을 놓치지 마.
프롬프트는 자연스러운 한국어 지시문으로 작성하고, 마지막 문단에 "결과는 JSON만 반환하고, 코드 블록 없이 순수 JSON 문자열로 제공"이라는 문장을 꼭 포함해.

출력은 JSON 형태로, 다음 필드를 가져야 해:
- prompt (string)
- summary (string)
- guardrails (string[])
- checklist (string[])
- examples (array, 각 요소에 title/description/json)
- metadata (strategySummary, problemCount, includeAnswers)
  `.trim();
}

export const buildGenerationPromptTool = tool({
  description:
    "분석된 전략과 사용자 폼을 기반으로 LLM이 문제집 JSON을 생성할 때 사용할 프롬프트 패키지를 구성합니다.",
  inputSchema: buildPromptInputSchema,
  execute: async (input) => {
    const data = buildPromptInputSchema.parse(input);
    const problemCount = resolveProblemCount(data.problemCount, data.strategy);
    const includeAnswers = resolveIncludeAnswers(data.includeAnswers, data.strategy);

    const fallback = fallbackPromptPackage({
      form: data.form,
      strategy: data.strategy,
      problemCount,
      includeAnswers,
    });

    try {
      const result = await generateObject({
        model: openai("gpt-4o"),
        schema: promptPackageSchema,
        prompt: buildPromptLLMPrompt({
          form: data.form,
          strategy: data.strategy,
          problemCount,
          includeAnswers,
          fallback,
        }),
      });

      return result.object;
    } catch (error) {
      console.warn("buildGenerationPromptTool: LLM 프롬프트 생성 실패, 휴리스틱 프롬프트 사용", error);
      return fallback;
    }
  },
});

