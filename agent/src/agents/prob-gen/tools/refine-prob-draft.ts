import { openai } from "@ai-sdk/openai";
import { generateObject, tool } from "ai";
import { z } from "zod";
import {
  probGenerationFormSchema,
  probGenerationStrategySchema,
  probBookSaveSchema,
  probDraftEvaluationSchema,
  refineDraftResultSchema,
  type ProbDraftEvaluation,
  type ProbGenerationForm,
  type ProbGenerationStrategy,
  type RefineDraftResult,
} from "./shared-schemas";

const refineDraftInputSchema = z.object({
  form: probGenerationFormSchema,
  strategy: probGenerationStrategySchema,
  probBook: probBookSaveSchema,
  evaluation: probDraftEvaluationSchema,
  iteration: z.number().int().min(1).max(3).default(1),
});

function buildRefinePrompt(params: {
  form: ProbGenerationForm;
  strategy: ProbGenerationStrategy;
  probBook: z.infer<typeof probBookSaveSchema>;
  evaluation: ProbDraftEvaluation;
  iteration: number;
}): string {
  const { evaluation } = params;
  const issuesText =
    evaluation.issues && evaluation.issues.length > 0
      ? evaluation.issues
          .map(
            (issue, index) =>
              `${index + 1}. [${issue.severity}] ${issue.message}${
                issue.blockIndex != null ? ` (blockIndex=${issue.blockIndex})` : ""
              }`,
          )
          .join("\n")
      : "- 없음";

  const suggestionsText =
    evaluation.suggestions && evaluation.suggestions.length > 0
      ? evaluation.suggestions
          .map(
            (suggestion, index) =>
              `${index + 1}. (${suggestion.priority}) ${suggestion.action}${
                suggestion.rationale ? ` - ${suggestion.rationale}` : ""
              }`,
          )
          .join("\n")
      : "- 없음";

  return `
너는 문제집 에디터야. 아래 문제집 JSON을 평가 결과에 따라 개선해.

[기본 전략]
${JSON.stringify(params.strategy, null, 2)}

[현재 문제집]
${JSON.stringify(params.probBook, null, 2)}

[평가 결과]
- overallScore: ${evaluation.overallScore} (threshold=${evaluation.threshold}, pass=${evaluation.pass})
- issues:
${issuesText}
- suggestions:
${suggestionsText}

개선 지침:
1. 평가에서 지적된 문제를 우선 해결해.
2. 불필요한 변경은 피하고 필요한 부분만 수정해.
3. 문제 수, 정답 포함 정책, order 규칙을 준수해.
4. 전략의 형식/토픽 비중을 맞추도록 문제를 추가/수정/삭제할 수 있어.
5. 최종 결과는 RefineDraftResult 스키마(JSON)로만 반환해.

iteration: ${params.iteration}
  `.trim();
}

function fallbackRefinement(probBook: z.infer<typeof probBookSaveSchema>): RefineDraftResult {
  return {
    probBook,
    notes: ["LLM 개선에 실패해 기존 초안을 유지했어."],
  };
}

export const refineProbDraftTool = tool({
  description:
    "평가 결과를 바탕으로 문제집 초안을 보정하거나 재작성합니다.",
  inputSchema: refineDraftInputSchema,
  execute: async (input) => {
    const data = refineDraftInputSchema.parse(input);

    try {
      const result = await generateObject({
        model: openai("gpt-4o"),
        schema: refineDraftResultSchema,
        prompt: buildRefinePrompt(data),
      });

      return result.object;
    } catch (error) {
      console.error("refineProbDraftTool: 개선 실패", error);
      return fallbackRefinement(data.probBook);
    }
  },
});