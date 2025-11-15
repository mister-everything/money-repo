import { openai } from "@ai-sdk/openai";
import { generateObject, tool } from "ai";
import { z } from "zod";
import {
  probBookSaveSchema,
  probGenerationFormSchema,
  probGenerationStrategySchema,
  promptPackageSchema,
  type ProbDraftGeneration,
  type ProbGenerationForm,
  type ProbGenerationStrategy,
  type PromptPackage,
} from "./shared-schemas";

const generateDraftInputSchema = z.object({
  form: probGenerationFormSchema,
  strategy: probGenerationStrategySchema,
  promptPackage: promptPackageSchema,
});

function buildFinalPrompt(promptPackage: PromptPackage): string {
  const segments: string[] = [promptPackage.prompt];

  if (promptPackage.guardrails && promptPackage.guardrails.length > 0) {
    segments.push(
      [
        "=== 필수 수칙 ===",
        ...promptPackage.guardrails.map((item) => `- ${item}`),
      ].join("\n"),
    );
  }

  if (promptPackage.checklist && promptPackage.checklist.length > 0) {
    segments.push(
      [
        "=== 체크리스트 ===",
        ...promptPackage.checklist.map((item) => `- ${item}`),
      ].join("\n"),
    );
  }

  if (promptPackage.examples && promptPackage.examples.length > 0) {
    const serializedExamples = promptPackage.examples
      .map(
        (example, index) => `
예시 ${index + 1}: ${example.title}
${example.description ? `${example.description}\n` : ""}${example.json}
        `.trim(),
      )
      .join("\n\n");

    segments.push(`=== 참고 예시 ===\n${serializedExamples}`);
  }

  segments.push("=== 출력 형식 ===\n순수 JSON 문자열로만 응답해. 코드 블록을 사용하지 마.");

  return segments.join("\n\n");
}

function fallbackDraft({
  form,
  strategy,
}: {
  form: ProbGenerationForm;
  strategy: ProbGenerationStrategy;
}): ProbDraftGeneration {
  return {
    probBook: {
      ownerId: "USER_ID_PLACEHOLDER",
      title: strategy.summary ?? `${form.topic.join(", ")} 문제집`,
      description:
        strategy.requirementStatement ??
        `${form.topic.join(", ")} 주제의 문제집`,
      tags: strategy.suggestedTags,
      blocks: [],
      isPublic: false,
    },
    notes: ["AI 생성 중 오류 발생으로 기본 템플릿을 반환했습니다."],
  };
}

export const generateProbDraftTool = tool({
  description:
    "완성된 프롬프트 패키지를 사용해 AI로부터 문제집 초안을 생성합니다.",
  inputSchema: generateDraftInputSchema,
  execute: async (input) => {
    const data = generateDraftInputSchema.parse(input);
    const finalPrompt = buildFinalPrompt(data.promptPackage);

    try {
      const result = await generateObject({
        model: openai("gpt-4o"),
        schema: probBookSaveSchema,
        prompt: finalPrompt,
      });

      const generation: ProbDraftGeneration = {
        probBook: result.object,
        raw: result,
        notes: [
          `프롬프트 요약: ${data.promptPackage.summary}`,
          `guardrails: ${(data.promptPackage.guardrails ?? []).length}개`,
        ],
      };

      return generation;
    } catch (error) {
      console.error("generateProbDraftTool: 초안 생성 실패", error);
      return fallbackDraft({ form: data.form, strategy: data.strategy });
    }
  },
});