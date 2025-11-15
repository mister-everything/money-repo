import { tool, type ModelMessage, type Tool } from "ai";
import { z } from "zod";
import { searchAgeGroupTool } from "./search-age-group";
import { searchDifficultyTool } from "./search-difficulty";
import { searchProblemTypeTool } from "./search-problem-type";
import { searchSituationTool } from "./search-situation";
import { searchTagsTool } from "./search-tags";
import { searchTopicTool } from "./search-topic";
import {
  ageClassificationSchema,
  extendedDifficultySchema,
  problemTypeRecommendationResultSchema,
  searchProfileSchema,
  situationSelectionSchema,
  tagSuggestionResultSchema,
  topicClassificationSchema,
  type SearchProfile,
} from "./shared-schemas";

const profileInputSchema = z.object({
  description: z
    .string()
    .min(5)
    .describe("문제집의 핵심 설명 또는 요구사항"),
  platform: z
    .string()
    .optional()
    .describe("사용 플랫폼 (온라인/오프라인 등)"),
  audience: z
    .string()
    .optional()
    .describe("주요 참여자/타깃 학습자 정보"),
  desiredOutcome: z
    .string()
    .optional()
    .describe("달성하고 싶은 효과 (예: 친목, 평가, 콘텐츠 활용)"),
  existingTags: z
    .array(z.string().min(1).max(8))
    .max(10)
    .optional()
    .describe("이미 보유한 태그 목록 (각 태그 최대 8자, 최대 10개)"),
  maxProblemTypes: z
    .number()
    .int()
    .min(1)
    .max(6)
    .default(3),
});

const defaultToolOptions = {
  toolCallId: "prob-search-profile",
} as const;

async function runSubTool<OUTPUT>(
  toolInstance: Tool,
  input: unknown,
  suffix: string,
): Promise<OUTPUT> {
  if (!toolInstance.execute) {
    throw new Error(`${suffix} 도구에 execute가 없습니다.`);
  }

  return toolInstance.execute(input, {
    ...defaultToolOptions,
    toolCallId: `${defaultToolOptions.toolCallId}:${suffix}`,
    messages: [] as ModelMessage[],
  }) as Promise<OUTPUT>;
}

export const buildSearchProfileTool = tool({
  description:
    "태그·소재·연령·난이도·상황·유형 도구를 묶어 통합 검색 프로필을 구성합니다.",
  inputSchema: profileInputSchema,
  execute: async (rawInput) => {
    const input = profileInputSchema.parse(rawInput);

    const [tags, topic, age, difficulty, situation, problemTypes] =
      await Promise.all([
        runSubTool<z.infer<typeof tagSuggestionResultSchema>>(
          searchTagsTool,
          {
            description: input.description,
            desiredTone: input.audience ?? input.desiredOutcome,
            existingTags: input.existingTags,
            maxTags: 10,
          },
          "tags",
        ),
        runSubTool<z.infer<typeof topicClassificationSchema>>(
          searchTopicTool,
          {
            description: input.description,
          },
          "topic",
        ),
        runSubTool<z.infer<typeof ageClassificationSchema>>(
          searchAgeGroupTool,
          {
            description: `${input.description} ${input.desiredOutcome ?? ""}`,
            currentDifficulty: undefined,
          },
          "age",
        ),
        runSubTool<z.infer<typeof extendedDifficultySchema>>(
          searchDifficultyTool,
          {
            description: input.description,
            targetLearner: input.audience,
          },
          "difficulty",
        ),
        runSubTool<z.infer<typeof situationSelectionSchema>>(
          searchSituationTool,
          {
            description: input.description,
            audience: input.audience,
            desiredOutcome: input.desiredOutcome,
          },
          "situation",
        ),
        runSubTool<z.infer<typeof problemTypeRecommendationResultSchema>>(
          searchProblemTypeTool,
          {
            description: input.description,
            platform: input.platform,
            targetAudience: input.audience,
            desiredExperience: input.desiredOutcome,
            maxTypes: input.maxProblemTypes,
          },
          "problemType",
        ),
      ]);

    const profile: SearchProfile = searchProfileSchema.parse({
      tags,
      topic,
      age,
      difficulty,
      situation,
      problemTypes,
      notes: [
        "각 분류 결과는 문제집 생성 파이프라인에서 바로 재사용할 수 있습니다.",
        "추가적인 사용자 입력이 들어오면 해당 도구를 개별적으로 재호출하세요.",
      ],
    });

    return profile;
  },
});

