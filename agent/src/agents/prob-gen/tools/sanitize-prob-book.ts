import { tool } from "ai";
import { z } from "zod";
import {
  type ProbBookSave,
  probBookSaveSchema,
  probDraftEvaluationSchema,
  probGenerationFormSchema,
  probGenerationStrategySchema,
} from "./shared-schemas";

const finalizeInputSchema = z.object({
  formData: probGenerationFormSchema,
  strategy: probGenerationStrategySchema,
  probBook: probBookSaveSchema,
  problemCount: z.number().min(1).max(50),
  includeAnswers: z.boolean(),
  notes: z.array(z.string()).optional(),
  evaluation: probDraftEvaluationSchema.optional(),
});

type FinalizeOutput = {
  probBook: ProbBookSave;
  message?: string;
  warnings?: string[];
};

function reorderBlocks(
  blocks: ProbBookSave["blocks"],
  problemCount: number,
  includeAnswers: boolean,
) {
  return blocks.slice(0, problemCount).map((block, index) => ({
    ...block,
    order: index,
    answer: includeAnswers ? block.answer : undefined,
  }));
}

function ensureTags(
  probBook: ProbBookSave,
  strategyTags: string[],
  fallbackTags: string[],
) {
  const tags = new Set<string>();

  (probBook.tags ?? []).forEach((tag) => tags.add(tag));
  strategyTags.forEach((tag) => tags.add(tag));
  fallbackTags.forEach((tag) => tags.add(tag));

  const result = Array.from(tags).filter((tag) => tag.trim().length > 0);
  return result.length > 0 ? result.slice(0, 6) : ["일반"];
}

function buildFallbackTitle(strategySummary: string, formSituation: string) {
  return `${strategySummary} · ${formSituation}`.slice(0, 60);
}

export const finalizeProbBookTool = tool({
  description:
    "전략 및 폼 정보를 반영해 문제집 초안을 최종 정리하고 누락된 필드를 보완합니다.",
  inputSchema: finalizeInputSchema,
  execute: async (input): Promise<FinalizeOutput> => {
    const parsed = finalizeInputSchema.parse(input);

    const warnings: string[] = [];

    const normalizedBlocks = reorderBlocks(
      parsed.probBook.blocks ?? [],
      parsed.problemCount,
      parsed.includeAnswers,
    );

    if (normalizedBlocks.length < parsed.problemCount) {
      warnings.push(
        `요청한 문제 수(${parsed.problemCount})보다 ${parsed.problemCount - normalizedBlocks.length}개 적습니다.`,
      );
    }

    const mergedProbBook: ProbBookSave = {
      ...parsed.probBook,
      ownerId: parsed.probBook.ownerId || "USER_ID_PLACEHOLDER",
      title:
        parsed.probBook.title?.trim() ||
        buildFallbackTitle(parsed.strategy.summary, parsed.formData.situation),
      description:
        parsed.probBook.description?.trim() ||
        `${parsed.formData.situation} 상황에 맞는 ${parsed.problemCount}문제 세트`,
      tags: ensureTags(parsed.probBook, parsed.strategy.suggestedTags, [
        parsed.formData.situation,
        parsed.formData.platform,
        parsed.formData.ageGroup,
        ...parsed.formData.topic,
      ]),
      blocks: normalizedBlocks,
      isPublic: parsed.probBook.isPublic ?? false,
    };

    const result = probBookSaveSchema.safeParse(mergedProbBook);
    if (!result.success) {
      warnings.push("probBookSaveSchema 검증 실패로 기본 구조를 유지했습니다.");
      console.warn(
        "finalizeProbBookTool: schema validation failed",
        result.error.format(),
      );
    }

    const evaluationWarnings = [
      ...(parsed.evaluation?.notes ?? []),
      ...(parsed.evaluation?.issues?.map(
        (issue) => `[${issue.severity}] ${issue.message}`,
      ) ?? []),
    ];

    const combinedWarnings = [...warnings, ...evaluationWarnings].filter(
      (warning) => warning && warning.trim().length > 0,
    );

    const messageParts = parsed.notes ?? [];

    return {
      probBook: result.success ? result.data : mergedProbBook,
      message: messageParts.length > 0 ? messageParts.join("\n") : undefined,
      warnings: combinedWarnings.length > 0 ? combinedWarnings : undefined,
    };
  },
});

export const sanitizeProbBookTool = finalizeProbBookTool;
