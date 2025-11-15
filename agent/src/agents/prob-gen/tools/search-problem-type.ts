import { openai } from "@ai-sdk/openai";
import { generateObject, tool } from "ai";
import { z } from "zod";
import {
  problemTypeOptionSchema,
  problemTypeRecommendationResultSchema,
  type ProblemTypeRecommendation,
  type ProblemTypeRecommendationResult,
} from "./shared-schemas";

const PROBLEM_TYPE_GUIDE: Record<
  z.infer<typeof problemTypeOptionSchema>,
  { description: string; defaultUses: string[] }
> = {
  객관식: {
    description: "정답 선택형으로 빠른 채점과 난이도 조절이 쉽다.",
    defaultUses: ["교과 평가", "객관식 시험", "팀 대결"],
  },
  주관식: {
    description: "서술/단답형으로 사고력과 표현력을 확인한다.",
    defaultUses: ["개념 정의", "서술형 시험", "심화 토론"],
  },
  "O/X 퀴즈": {
    description: "명제 판단형으로 빠르게 진행되며 난이도 튜닝이 쉽다.",
    defaultUses: ["아이스브레이킹", "퀵 게임", "콘텐츠 참여 유도"],
  },
  "순위 매기기": {
    description: "제시된 항목을 순서대로 정렬하여 사고 과정을 드러낸다.",
    defaultUses: ["역사/타임라인", "업무 프로세스", "우선순위 토론"],
  },
  "낱말 퀴즈": {
    description: "초성/낱말 맞히기 등 언어 유추 기반 퀴즈다.",
    defaultUses: ["어휘력 향상", "재미 요소", "시니어 두뇌 훈련"],
  },
  "이미지/오디오": {
    description: "시청각 자료를 활용해 몰입감을 높인다.",
    defaultUses: ["K-POP/드라마 퀴즈", "시각 자료 해석", "현장 이벤트"],
  },
};

const searchProblemTypeInputSchema = z.object({
  description: z
    .string()
    .min(5)
    .describe("문제집 주제/형식/사용 환경 설명"),
  platform: z
    .string()
    .optional()
    .describe("사용 플랫폼 (온라인, 오프라인, 하이브리드 등)"),
  targetAudience: z
    .string()
    .optional()
    .describe("참여자 정보"),
  desiredExperience: z
    .string()
    .optional()
    .describe("희망하는 경험 (예: 빠르게 몰입, 심화 학습)"),
  maxTypes: z
    .number()
    .int()
    .min(1)
    .max(6)
    .default(3),
});

type SearchProblemTypeInput = z.infer<typeof searchProblemTypeInputSchema>;

function getDefaultRecommendations(
  input: SearchProblemTypeInput,
): ProblemTypeRecommendationResult {
  const picks: ProblemTypeRecommendation[] = [];
  const text = `${input.description} ${input.platform ?? ""} ${input.desiredExperience ?? ""}`.toLowerCase();

  const pushIfRelevant = (
    type: z.infer<typeof problemTypeOptionSchema>,
    reason: string,
    weight: number,
  ) => {
    if (picks.find((item) => item.type === type)) return;
    picks.push({
      type,
      reason,
      weight,
      sampleUseCases: PROBLEM_TYPE_GUIDE[type].defaultUses,
    });
  };

  if (/(교과|시험|평가|학습|내신|수능)/.test(text)) {
    pushIfRelevant("객관식", "평가/학습 맥락과 궁합이 좋습니다.", 0.35);
    pushIfRelevant("주관식", "심화 개념 점검에 필요합니다.", 0.3);
  }

  if (/(밸런스|파티|친목|회식|재미|분위기)/.test(text)) {
    pushIfRelevant("O/X 퀴즈", "빠른 진행과 반응을 유도합니다.", 0.3);
    pushIfRelevant("낱말 퀴즈", "웃음과 두뇌 자극을 동시에 제공합니다.", 0.25);
  }

  if (/(역사|타임라인|순서|프로세스|정렬)/.test(text)) {
    pushIfRelevant("순위 매기기", "순서 판단형 문제에 적합합니다.", 0.3);
  }

  if (/(k-pop|음악|드라마|이미지|사진|영상|음향)/.test(text)) {
    pushIfRelevant(
      "이미지/오디오",
      "시청각 자료를 활용해 몰입감을 높입니다.",
      0.3,
    );
  }

  if (picks.length === 0) {
    pushIfRelevant("객관식", "기본 추천 유형", 0.34);
    pushIfRelevant("O/X 퀴즈", "빠른 진행을 위한 보조 유형", 0.33);
    pushIfRelevant("낱말 퀴즈", "재미 요소 확보", 0.33);
  }

  return {
    recommendations: picks.slice(0, input.maxTypes),
    summary: "휴리스틱 기반 기본 추천",
  };
}

function buildPrompt(input: SearchProblemTypeInput): string {
  const guide = Object.entries(PROBLEM_TYPE_GUIDE)
    .map(
      ([type, info]) =>
        `- ${type}: ${info.description} (활용 예: ${info.defaultUses.join(", ")})`,
    )
    .join("\n");

  return `
너는 문제 유형 추천 전문가야. 아래 정보를 참고해 가장 적합한 문제 유형을 추천해.

사용 가능한 유형:
${guide}

규칙:
- recommendations 배열을 1~${input.maxTypes}개로 반환
- 각 항목에 type, reason, weight(0~1), sampleUseCases(2~3개)를 포함
- weight 합은 1에 가깝도록 분배
- summary에는 전체 추천 근거를 1~2문장으로 작성

입력 설명:
- 내용: ${input.description}
- 플랫폼: ${input.platform ?? "미정"}
- 대상: ${input.targetAudience ?? "미정"}
- 경험 목표: ${input.desiredExperience ?? "미정"}

출력(JSON):
{
  "recommendations": [
    {
      "type": "객관식",
      "reason": "...",
      "weight": 0.4,
      "sampleUseCases": ["..."]
    }
  ],
  "summary": "..."
}

JSON만 반환해.
  `.trim();
}

export const searchProblemTypeTool = tool({
  description:
    "사용 목적과 플랫폼에 따라 문제 유형(객관식, 주관식, O/X 등)을 추천하고 활용 팁을 제공합니다.",
  inputSchema: searchProblemTypeInputSchema,
  execute: async (rawInput) => {
    const input = searchProblemTypeInputSchema.parse(rawInput);
    const prompt = buildPrompt(input);

    try {
      const { object } = await generateObject({
        model: openai("gpt-4o"),
        schema: problemTypeRecommendationResultSchema,
        prompt,
      });

      const normalized = object.recommendations
        .filter((item) => PROBLEM_TYPE_GUIDE[item.type])
        .slice(0, input.maxTypes)
        .map<ProblemTypeRecommendation>((item) => ({
          type: item.type,
          reason: item.reason,
          weight:
            typeof item.weight === "number"
              ? Number(item.weight.toFixed(2))
              : undefined,
          sampleUseCases:
            item.sampleUseCases?.length && item.sampleUseCases.length > 0
              ? item.sampleUseCases
              : PROBLEM_TYPE_GUIDE[item.type].defaultUses,
        }));

      if (normalized.length === 0) {
        return getDefaultRecommendations(input);
      }

      return {
        recommendations: normalized,
        summary: object.summary,
      };
    } catch (error) {
      console.warn("searchProblemTypeTool: fallback due to error", error);
      return getDefaultRecommendations(input);
    }
  },
});

