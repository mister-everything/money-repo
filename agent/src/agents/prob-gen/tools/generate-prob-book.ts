import { type ModelMessage, type Tool, tool } from "ai";
import { z } from "zod";
import { analyzeFormStrategyTool } from "./analyze-form-strategy";
import { buildGenerationPromptTool } from "./build-generation-prompt";
import { evaluateProbDraftTool } from "./evaluate-prob-draft";
import { generateProbDraftTool } from "./generate-prob-draft";
import { refineProbDraftTool } from "./refine-prob-draft";
import { searchAgeGroupTool } from "./search-age-group";
import { searchDifficultyTool } from "./search-difficulty";
import { searchTagsTool } from "./search-tags";
import { searchTopicTool } from "./search-topic";
import { finalizeProbBookTool } from "./sanitize-prob-book";
import {
  type ProbBookSave,
  type ProbDraftEvaluation,
  type ProbDraftGeneration,
  type ProbGenerationForm,
  type ProbGenerationStrategy,
  type PromptPackage,
  ageBandSchema,
  ageClassificationSchema,
  extendedDifficultySchema,
  probGenerationFormSchema,
  tagSuggestionResultSchema,
  topicClassificationSchema,
} from "./shared-schemas";
import { validateProbBookTool } from "./validate-prob-book";

const DEFAULT_PROBLEM_COUNT = 10;
const DEFAULT_MAX_ITERATIONS = 2;
const DEFAULT_THRESHOLD = 9;

const pipelineInputSchema = z.object({
  form: probGenerationFormSchema,
  problemCount: z.number().int().min(1).max(50).optional(),
  includeAnswers: z.boolean().optional(),
  maxIterations: z.number().int().min(1).max(3).default(DEFAULT_MAX_ITERATIONS),
  scoreThreshold: z.number().min(0).max(10).default(DEFAULT_THRESHOLD),
});

const defaultToolOptions = {
  toolCallId: "prob-gen",
} as const;

async function runSubTool<OUTPUT>(
  toolInstance: Tool,
  input: unknown,
  suffix: string,
): Promise<OUTPUT> {
  if (!toolInstance.execute) {
    throw new Error(`${suffix} 도구에 실행 함수가 정의되어 있지 않습니다.`);
  }

  return toolInstance.execute(input, {
    ...defaultToolOptions,
    toolCallId: `${defaultToolOptions.toolCallId}:${suffix}`,
    messages: [] as ModelMessage[],
  }) as Promise<OUTPUT>;
}

type RefinementLog = {
  iteration: number;
  appliedChanges?: { description: string }[];
  notes?: string[];
};

type PipelineMetadata = {
  strategy: ProbGenerationStrategy;
  promptPackage: PromptPackage;
  draftGeneration: ProbDraftGeneration;
  evaluations: ProbDraftEvaluation[];
  refinements: RefinementLog[];
  iterations: number;
  includeAnswers: boolean;
  problemCount: number;
  classifications: {
    tags: z.infer<typeof tagSuggestionResultSchema>;
    topic: z.infer<typeof topicClassificationSchema>;
    age: z.infer<typeof ageClassificationSchema>;
    difficulty: z.infer<typeof extendedDifficultySchema>;
  };
};

function applyScoreThreshold(
  evaluation: ProbDraftEvaluation,
  threshold: number,
): ProbDraftEvaluation {
  if (
    evaluation.threshold === threshold &&
    evaluation.pass === evaluation.overallScore >= threshold
  ) {
    return evaluation;
  }

  return {
    ...evaluation,
    threshold,
    pass: evaluation.overallScore >= threshold && evaluation.pass !== false,
  };
}

function buildSuccessMessage({
  probBook,
  form,
  strategy,
  evaluation,
  iterations,
}: {
  probBook: ProbBookSave;
  form: ProbGenerationForm;
  strategy: ProbGenerationStrategy;
  evaluation?: ProbDraftEvaluation;
  iterations: number;
}): string {
  const lines: string[] = [
    `✅ "${probBook.title}" 문제집을 ${probBook.blocks.length}문항으로 완성했어.`,
    `- 상황: ${form.situation} / 인원: ${form.people} / 플랫폼: ${form.platform}`,
    `- 형식 구성: ${strategy.formatPlan
      .map(
        (plan) =>
          `${plan.label}${plan.targetCount != null ? ` ${plan.targetCount}문항` : ""}`,
      )
      .join(", ")}`,
    `- 반복 횟수: ${iterations}회`,
  ];

  if (evaluation) {
    lines.push(
      `- 품질 점수: ${evaluation.overallScore.toFixed(1)}/${evaluation.threshold} (pass=${
        evaluation.pass ? "yes" : "no"
      })`,
    );
  }

  return lines.join("\n");
}

function buildClassifierDescription(form: ProbGenerationForm): string {
  const format = Array.isArray(form.format) ? form.format.join(", ") : form.format;
  const lines = [
    `상황: ${form.situation}`,
    `인원: ${form.people}`,
    `연령대: ${form.ageGroup}`,
    `플랫폼: ${form.platform}`,
    `형식: ${format}`,
    `소재: ${form.topic.join(", ")}`,
    `난이도: ${form.difficulty}`,
  ];

  if (form.description && form.description.trim().length > 0) {
    lines.push(`추가 설명: ${form.description.trim()}`);
  }

  return lines.join("\n");
}

function mergeTags(...tagLists: Array<string[] | undefined>): string[] {
  const set = new Set<string>();
  for (const list of tagLists) {
    if (!list) continue;
    for (const tag of list) {
      if (!tag) continue;
      const trimmed = tag.trim();
      if (trimmed.length === 0) continue;
      set.add(trimmed);
      if (set.size >= 10) break;
    }
    if (set.size >= 10) break;
  }
  return Array.from(set);
}

export const generateProbBookTool = tool({
  description:
    "폼 입력 → 전략 수립 → 프롬프트 작성 → 초안 생성 → 평가/개선 → 최종 정제/검증까지 수행하는 문제집 생성 파이프라인",
  inputSchema: pipelineInputSchema,
  execute: async (rawInput) => {
    const input = pipelineInputSchema.parse(rawInput);

    try {
      // 1. 전략 분석
      const strategy = await runSubTool<ProbGenerationStrategy>(
        analyzeFormStrategyTool,
        {
          form: input.form,
          problemCount: input.problemCount,
          includeAnswers: input.includeAnswers,
        },
        "analyze",
      );

      const resolvedProblemCount =
        input.problemCount ??
        strategy.recommendedProblemCount ??
        DEFAULT_PROBLEM_COUNT;
      const resolvedIncludeAnswers =
        typeof input.includeAnswers === "boolean"
          ? input.includeAnswers
          : strategy.includeAnswers;

      const classifierDescription = buildClassifierDescription(input.form);
      const [tagSuggestions, topicClassification, ageClassification, difficultyClassification] =
        await Promise.all([
          runSubTool<z.infer<typeof tagSuggestionResultSchema>>(
            searchTagsTool,
            {
              description: classifierDescription,
              desiredTone: input.form.situation,
              existingTags: strategy.suggestedTags,
              maxTags: 10,
            },
            "classify:tags",
          ),
          runSubTool<z.infer<typeof topicClassificationSchema>>(
            searchTopicTool,
            {
              description: classifierDescription,
              preferredMainCategory: strategy.topicPlan?.[0]?.label,
            },
            "classify:topic",
          ),
          runSubTool<z.infer<typeof ageClassificationSchema>>(
            searchAgeGroupTool,
            {
              description: classifierDescription,
              currentDifficulty: strategy.difficulty.userDifficulty,
              preferredAgeBand: ageBandSchema.safeParse(input.form.ageGroup).success
                ? (input.form.ageGroup as z.infer<typeof ageBandSchema>)
                : undefined,
            },
            "classify:age",
          ),
          runSubTool<z.infer<typeof extendedDifficultySchema>>(
            searchDifficultyTool,
            {
              description: classifierDescription,
              targetLearner: input.form.people,
            },
            "classify:difficulty",
          ),
        ]);

      // 2. 프롬프트 패키지 구성
      const promptPackage = await runSubTool<PromptPackage>(
        buildGenerationPromptTool,
        {
          form: input.form,
          strategy,
          problemCount: resolvedProblemCount,
          includeAnswers: resolvedIncludeAnswers,
        },
        "prompt",
      );

      // 3. 초안 생성
      const draftGeneration = await runSubTool<ProbDraftGeneration>(
        generateProbDraftTool,
        {
          form: input.form,
          strategy,
          promptPackage,
        },
        "draft",
      );

      let currentProbBook = draftGeneration.probBook;
      const evaluations: ProbDraftEvaluation[] = [];
      const refinements: RefinementLog[] = [];

      // 4. 평가 + 개선 루프
      for (let iteration = 0; iteration < input.maxIterations; iteration += 1) {
        const evaluation = await runSubTool<ProbDraftEvaluation>(
          evaluateProbDraftTool,
          {
            form: input.form,
            strategy,
            probBook: currentProbBook,
          },
          `evaluate:${iteration}`,
        );

        const normalizedEvaluation = applyScoreThreshold(
          evaluation,
          input.scoreThreshold,
        );
        evaluations.push(normalizedEvaluation);

        if (
          normalizedEvaluation.pass ||
          iteration === input.maxIterations - 1
        ) {
          break;
        }

        const refinement = await runSubTool<{
          probBook: ProbBookSave;
          appliedChanges?: { description: string }[];
          notes?: string[];
        }>(
          refineProbDraftTool,
          {
            form: input.form,
            strategy,
            probBook: currentProbBook,
            evaluation: normalizedEvaluation,
            iteration: iteration + 1,
          },
          `refine:${iteration}`,
        );

        refinements.push({
          iteration: iteration + 1,
          appliedChanges: refinement.appliedChanges,
          notes: refinement.notes,
        });

        currentProbBook = refinement.probBook;
      }

      const lastEvaluation = evaluations[evaluations.length - 1];

      // 5. 최종 정제
      const finalized = await runSubTool<{
        probBook: ProbBookSave;
        message?: string;
        warnings?: string[];
      }>(
        finalizeProbBookTool,
        {
          formData: input.form,
          strategy,
          probBook: currentProbBook,
          problemCount: resolvedProblemCount,
          includeAnswers: resolvedIncludeAnswers,
          notes: [
            promptPackage.summary,
            ...(draftGeneration.notes ?? []),
            ...refinements.flatMap((refinement) => refinement.notes ?? []),
          ],
          evaluation: lastEvaluation,
        },
        "finalize",
      );

      // 6. 검증
      await runSubTool(
        validateProbBookTool,
        {
          probBook: finalized.probBook,
          strategy,
          formData: input.form,
          problemCount: resolvedProblemCount,
          includeAnswers: resolvedIncludeAnswers,
        },
        "validate",
      );

      const classifierTagStrings = tagSuggestions.tags
        ?.map((entry) => entry.tag)
        .filter((tag): tag is string => Boolean(tag));
      const enhancedTags = mergeTags(classifierTagStrings, finalized.probBook.tags);
      finalized.probBook.tags = enhancedTags;

      const metadata: PipelineMetadata = {
        strategy,
        promptPackage,
        draftGeneration,
        evaluations,
        refinements,
        iterations: evaluations.length,
        includeAnswers: resolvedIncludeAnswers,
        problemCount: resolvedProblemCount,
        classifications: {
          tags: tagSuggestions,
          topic: topicClassification,
          age: ageClassification,
          difficulty: difficultyClassification,
        },
      };

      return {
        probBook: finalized.probBook,
        message: buildSuccessMessage({
          probBook: finalized.probBook,
          form: input.form,
          strategy,
          evaluation: lastEvaluation,
          iterations: metadata.iterations,
        }),
        metadata,
      };
    } catch (error) {
      console.error("generateProbBookTool: 파이프라인 실패", error);

      return {
        probBook: {
          ownerId: "USER_ID_PLACEHOLDER",
          title: `${input.form.topic.join(", ")} 문제집`,
          description: `${input.form.situation} 상황을 위한 기본 문제집 (생성 실패)`,
          isPublic: false,
          tags: input.form.topic,
          blocks: [],
        },
        message: `❌ 문제집 생성 중 오류가 발생했어: ${error}`,
        metadata: {
          fallback: true,
        },
      };
    }
  },
});
