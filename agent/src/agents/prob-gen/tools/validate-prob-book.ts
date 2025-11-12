import { tool } from "ai";
import { z } from "zod";
import {
  type ProbBookSave,
  probBookSaveSchema,
  probGenerationFormSchema,
  probGenerationStrategySchema,
} from "./shared-schemas";

const validateInputSchema = z.object({
  probBook: probBookSaveSchema,
  strategy: probGenerationStrategySchema,
  formData: probGenerationFormSchema,
  problemCount: z.number().min(1).max(50),
  includeAnswers: z.boolean(),
});

function validateAnswerPolicy(
  blocks: ProbBookSave["blocks"],
  includeAnswers: boolean,
  issues: string[],
) {
  for (const block of blocks) {
    if (!includeAnswers && block.answer) {
      issues.push(
        `includeAnswers=false인데 '${block.type}' 유형 문제에 answer가 포함되어 있습니다.`,
      );
    }
    if (includeAnswers && !block.answer) {
      issues.push(
        `includeAnswers=true인데 '${block.type}' 유형 문제에 answer가 누락되었습니다.`,
      );
    }
  }
}

function validateBlockQuestions(
  blocks: ProbBookSave["blocks"],
  issues: string[],
) {
  blocks.forEach((block, index) => {
    if (!block.question || !block.question.trim()) {
      issues.push(`문항 ${index + 1} (${block.type})에 질문 내용이 없습니다.`);
    }
  });
}

function validateTagCoverage(
  probBook: ProbBookSave,
  strategyTags: string[],
  issues: string[],
) {
  const tags = probBook.tags ?? [];

  if (tags.length === 0) {
    issues.push("tags가 비어 있습니다. 최소 1개 이상의 태그가 필요합니다.");
    return;
  }

  const missing = strategyTags.filter(
    (target) => !tags.some((tag) => tag.toLowerCase() === target.toLowerCase()),
  );

  if (missing.length > 0) {
    issues.push(
      `전략에서 제안한 태그 중 일부가 누락되었습니다: ${missing.join(", ")}`,
    );
  }
}

export const validateProbBookTool = tool({
  description:
    "생성된 문제집이 전략과 요구 조건(문항 수, 정답 필드, 태그 등)을 만족하는지 검증합니다.",
  inputSchema: validateInputSchema,
  execute: async ({
    probBook,
    strategy,
    formData,
    problemCount,
    includeAnswers,
  }) => {
    const issues: string[] = [];

    if (probBook.blocks.length !== problemCount) {
      issues.push(
        `문제 수가 요청(${problemCount}개)과 일치하지 않습니다. 현재 ${probBook.blocks.length}개입니다.`,
      );
    }

    validateAnswerPolicy(probBook.blocks, includeAnswers, issues);
    validateBlockQuestions(probBook.blocks, issues);
    validateTagCoverage(probBook, strategy.suggestedTags, issues);

    if (!probBook.title || !probBook.title.trim()) {
      issues.push("title이 비어 있습니다.");
    }

    if (!probBook.description || !probBook.description.trim()) {
      issues.push("description이 비어 있습니다.");
    }

    if (!issues.length) {
      return {
        isValid: true as const,
        issues,
        metadata: {
          situation: formData.situation,
          strategySummary: strategy.summary,
        },
      };
    }

    throw new Error(
      `문제집 검증에 실패했습니다:\n${issues
        .map((issue) => `- ${issue}`)
        .join("\n")}`,
    );
  },
});
