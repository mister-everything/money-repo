import { openai } from "@ai-sdk/openai";
import { generateObject, tool } from "ai";
import { z } from "zod";
import {
  probDraftEvaluationSchema,
  probGenerationFormSchema,
  probGenerationStrategySchema,
  probBookSaveSchema,
  type ProbDraftEvaluation,
  type ProbGenerationForm,
  type ProbGenerationStrategy,
  type WeightedPlanItem,
} from "./shared-schemas";

const evaluateDraftInputSchema = z.object({
  form: probGenerationFormSchema,
  strategy: probGenerationStrategySchema,
  probBook: probBookSaveSchema,
});

type DeterministicIssue = {
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  blockIndex?: number;
};

type DeterministicContext = {
  formatCoverage: ProbDraftEvaluation["formatCoverage"];
  topicCoverage: ProbDraftEvaluation["topicCoverage"];
  difficultyNotes: string[];
  participantNotes: string[];
  platformNotes: string[];
  issues: DeterministicIssue[];
};

const formatLabelToType: Record<string, WeightedPlanItem["problemType"]> = {
  객관식: "mcq",
  주관식: "default",
  "OX 게임": "ox",
  "이미지/오디오": "mcq",
  "날말퀴즈": "default",
  순위: "ranking",
  "순위 맞추기": "ranking",
  매칭: "matching",
  투표: "mcq",
  설문: "default",
};

function computeDeterministicChecks({
  form,
  strategy,
  probBook,
}: {
  form: ProbGenerationForm;
  strategy: ProbGenerationStrategy;
  probBook: z.infer<typeof probBookSaveSchema>;
}): DeterministicContext {
  const issues: DeterministicIssue[] = [];
  const problemCount = strategy.recommendedProblemCount;
  const includeAnswers = strategy.includeAnswers;
  const blocks = probBook.blocks ?? [];

  if (blocks.length !== problemCount) {
    issues.push({
      severity: "high",
      message: `요청한 문제 수(${problemCount})와 생성된 문제 수(${blocks.length})가 일치하지 않아.`,
    });
  }

  blocks.forEach((block, index) => {
    if (includeAnswers && !block.answer) {
      issues.push({
        severity: "high",
        message: `includeAnswers=true인데 ${index + 1}번 문제에 answer가 없어.`,
        blockIndex: index,
      });
    }
    if (!includeAnswers && block.answer) {
      issues.push({
        severity: "medium",
        message: `includeAnswers=false인데 ${index + 1}번 문제에 answer가 존재해.`,
        blockIndex: index,
      });
    }
    if (!block.question || block.question.trim().length === 0) {
      issues.push({
        severity: "medium",
        message: `${index + 1}번 문제에 question이 비어 있어.`,
        blockIndex: index,
      });
    }
  });

  const totalBlocks = blocks.length || problemCount;
  const blockTypeCounts = blocks.reduce<Record<string, number>>((acc, block) => {
    acc[block.type] = (acc[block.type] ?? 0) + 1;
    return acc;
  }, {});

  const formatCoverage =
    strategy.formatPlan?.map((planItem) => {
      const blockType =
        planItem.problemType ?? formatLabelToType[planItem.label ?? ""];
      const actualCount =
        typeof blockType === "string" ? blockTypeCounts[blockType] ?? 0 : 0;
      const expectedCount =
        planItem.targetCount ?? Math.round((planItem.weight ?? 0) * problemCount);
      const meetsExpectation =
        expectedCount === 0
          ? true
          : Math.abs(actualCount - expectedCount) <= Math.max(1, Math.floor(problemCount * 0.1));

      const notes: string[] = [];
      if (!blockType) {
        notes.push("problemType이 명시되지 않아 정확한 비교가 어려워.");
      }
      if (!meetsExpectation) {
        notes.push(
          `예상 ${expectedCount}문항 대비 실제 ${actualCount}문항으로 차이가 있어.`,
        );
      }

      if (!meetsExpectation) {
        issues.push({
          severity: "medium",
          message: `'${planItem.label}' 형식 비중이 계획과 다르게 생성됐어.`,
        });
      }

      return {
        label: planItem.label ?? (blockType ?? "unknown"),
        expectedCount,
        expectedWeight: planItem.weight,
        actualCount,
        actualWeight: totalBlocks > 0 ? actualCount / totalBlocks : 0,
        meetsExpectation,
        notes: notes.length > 0 ? notes.join(" ") : undefined,
      };
    }) ?? undefined;

  const topicCoverage =
    strategy.topicPlan?.map((planItem) => {
      const expectedCount =
        planItem.targetCount ?? Math.round((planItem.weight ?? 0) * problemCount);
      return {
        label: planItem.label,
        expectedCount,
        expectedWeight: planItem.weight,
        actualCount: 0,
        actualWeight: undefined,
        meetsExpectation: false,
        notes: "토픽 커버리지는 LLM 평가에 의존해.",
      };
    }) ?? undefined;

  const difficultyNotes = [
    `사용자 난이도: ${form.difficulty}`,
    `정규화 난이도: ${strategy.difficulty.normalized}`,
  ];

  const participantNotes = strategy.participantNotes
    ? [strategy.participantNotes]
    : [];
  const platformNotes = strategy.platformNotes ? [strategy.platformNotes] : [];

  return {
    formatCoverage,
    topicCoverage,
    difficultyNotes,
    participantNotes,
    platformNotes,
    issues,
  };
}

function buildEvaluationPrompt(params: {
  form: ProbGenerationForm;
  strategy: ProbGenerationStrategy;
  probBook: z.infer<typeof probBookSaveSchema>;
  deterministic: DeterministicContext;
}): string {
  const { deterministic } = params;

  return `
너는 QA 전문가야. 아래 문제집 초안이 전략을 얼마나 잘 따르는지 평가해.

[전략 요약]
${params.strategy.summary}

[필수 조건]
- 문제 수: ${params.strategy.recommendedProblemCount}
- 정답 포함: ${params.strategy.includeAnswers}
- 난이도: ${params.strategy.difficulty.normalized}
- 형식 계획: ${JSON.stringify(params.strategy.formatPlan, null, 2)}
- 토픽 계획: ${JSON.stringify(params.strategy.topicPlan, null, 2)}

[사용자 폼]
${JSON.stringify(params.form, null, 2)}

[생성된 문제집]
${JSON.stringify(params.probBook, null, 2)}

[결정적 체크 결과]
${JSON.stringify(deterministic, null, 2)}

평가 기준:
1. 형식/토픽 비중이 전략과 얼마나 일치하는지
2. 난이도, 참가자, 플랫폼 메모를 반영했는지
3. 정답 포함 정책과 문제 수 규칙을 지켰는지
4. 전체 완성도와 사용자 설명과의 적합성

결과는 JSON으로만 반환하고, 제공된 스키마를 반드시 지켜.
  `.trim();
}

function fallbackEvaluation({
  strategy,
  deterministic,
}: {
  strategy: ProbGenerationStrategy;
  deterministic: DeterministicContext;
}): ProbDraftEvaluation {
  const highOrCritical = deterministic.issues.filter((issue) =>
    ["high", "critical"].includes(issue.severity),
  );
  const medium = deterministic.issues.filter((issue) => issue.severity === "medium");

  const baseScore = 9.0;
  const score =
    baseScore - highOrCritical.length * 2 - medium.length * 1 - 0.5 * (deterministic.issues.length - highOrCritical.length - medium.length);
  const overallScore = Math.max(3, Math.min(9.5, score));

  return {
    overallScore,
    threshold: 9,
    pass: highOrCritical.length === 0,
    formatCoverage: deterministic.formatCoverage,
    topicCoverage: deterministic.topicCoverage,
    difficultyAssessment: {
      normalized: strategy.difficulty.normalized,
      meetsExpectation: true,
      notes: deterministic.difficultyNotes.join(" / "),
    },
    participantFit:
      deterministic.participantNotes.length > 0
        ? {
            meetsExpectation: true,
            notes: deterministic.participantNotes.join(" / "),
          }
        : undefined,
    platformFit:
      deterministic.platformNotes.length > 0
        ? {
            meetsExpectation: true,
            notes: deterministic.platformNotes.join(" / "),
          }
        : undefined,
    issues: deterministic.issues.map((issue) => ({
      severity: issue.severity,
      message: issue.message,
      blockIndex: issue.blockIndex,
    })),
    suggestions:
      deterministic.formatCoverage
        ?.filter((coverage) => coverage && !coverage.meetsExpectation)
        .map((coverage) => ({
          priority: "high" as const,
          action: `'${coverage.label}' 형식 문제 수를 계획에 맞춰 조정해.`,
          rationale: coverage.notes,
        })) ?? [],
    notes: ["LLM 평가 실패로 휴리스틱 평가를 사용했습니다."],
  };
}

export const evaluateProbDraftTool = tool({
  description:
    "생성된 문제집 초안을 전략과 비교해 점수화하고 개선 포인트를 도출합니다.",
  inputSchema: evaluateDraftInputSchema,
  execute: async (input) => {
    const data = evaluateDraftInputSchema.parse(input);
    const deterministic = computeDeterministicChecks(data);

    try {
      const result = await generateObject({
        model: openai("gpt-4o"),
        schema: probDraftEvaluationSchema,
        prompt: buildEvaluationPrompt({
          form: data.form,
          strategy: data.strategy,
          probBook: data.probBook,
          deterministic,
        }),
      });

      const evaluation = result.object;

      // Merge deterministic issues if missing
      if (!evaluation.issues) {
        evaluation.issues = [];
      }
      deterministic.issues.forEach((issue) => {
        const exists = evaluation.issues?.some(
          (existing) =>
            existing.message === issue.message &&
            existing.severity === issue.severity,
        );
        if (!exists) {
          evaluation.issues?.push({
            severity: issue.severity,
            message: issue.message,
            blockIndex: issue.blockIndex,
          });
        }
      });

      if (!evaluation.formatCoverage && deterministic.formatCoverage) {
        evaluation.formatCoverage = deterministic.formatCoverage;
      }
      if (!evaluation.topicCoverage && deterministic.topicCoverage) {
        evaluation.topicCoverage = deterministic.topicCoverage;
      }

      return evaluation;
    } catch (error) {
      console.error("evaluateProbDraftTool: 평가 실패", error);
      return fallbackEvaluation({ strategy: data.strategy, deterministic });
    }
  },
});