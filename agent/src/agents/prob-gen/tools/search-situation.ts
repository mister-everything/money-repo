import { openai } from "@ai-sdk/openai";
import { generateObject, tool } from "ai";
import { z } from "zod";
import {
  situationOptionSchema,
  situationSelectionSchema,
  type SituationSelection,
} from "./shared-schemas";

const situationGuides: Record<
  z.infer<typeof situationOptionSchema>,
  string[]
> = {
  "친목/파티": [
    "분위기를 빠르게 띄울 수 있는 가벼운 질문을 섞어라.",
    "정답보다 토론과 웃음을 유발하는 옵션을 준비해라.",
  ],
  "학습/평가": [
    "교육 목표와 직접적으로 연결된 문제를 포함해라.",
    "정답 근거를 명확히 제시하여 피드백을 강화해라.",
  ],
  "팀빌딩/교육": [
    "협업을 유도하는 문제 유형을 배치해라.",
    "팀 토론 시간을 고려해 문제 순서를 구성해라.",
  ],
  콘텐츠: [
    "제목과 썸네일에서 호기심을 자극할 수 있는 요소를 강조해라.",
    "참여형 투표/밸런스 게임 요소를 활용하라.",
  ],
};

const searchSituationInputSchema = z.object({
  description: z
    .string()
    .min(5)
    .describe("문제집이 사용될 맥락/장소/이벤트 설명"),
  audience: z
    .string()
    .optional()
    .describe("주요 참여자 정보 (예: 회사 신입, 중학생 반)"),
  desiredOutcome: z
    .string()
    .optional()
    .describe("목표 (예: 분위기 전환, 학습 평가)"),
});

type SearchSituationInput = z.infer<typeof searchSituationInputSchema>;

function fallbackSituation(input: SearchSituationInput): SituationSelection {
  const text = `${input.description} ${input.desiredOutcome ?? ""}`.toLowerCase();

  const matched: Array<keyof typeof situationGuides> = [];
  if (/(친목|회식|파티|밸런스|재미|웃음)/.test(text)) matched.push("친목/파티");
  if (/(학습|교육|내신|시험|평가|교과)/.test(text)) matched.push("학습/평가");
  if (/(팀|워크숍|HR|온보딩|팀빌딩)/.test(text)) matched.push("팀빌딩/교육");
  if (/(콘텐츠|마케팅|SNS|이벤트|참여)/.test(text)) matched.push("콘텐츠");

  const primary =
    matched[0] ??
    (input.desiredOutcome?.includes("학습") ? "학습/평가" : "친목/파티");
  const secondary = matched.filter((item) => item !== primary);

  return {
    primary,
    secondary: secondary.length ? secondary : undefined,
    rationale: "키워드 기반 기본 분류",
    guidance: situationGuides[primary],
  };
}

function buildPrompt(input: SearchSituationInput): string {
  return `
너는 문제집 사용 맥락을 분류하는 전문가야. 아래 정보를 참고해서 가장 적합한 상황을 고르고, 추가로 적합한 상황이 있다면 보조로 제안해.

선택 가능한 옵션: 친목/파티, 학습/평가, 팀빌딩/교육, 콘텐츠

규칙:
- primary에는 하나만 선택
- secondary에는 보조 옵션을 0~2개 나열
- rationale에는 선택 이유를 1~2문장으로 작성
- guidance에는 해당 상황에서 문제를 구성할 때의 팁을 bullet 형식으로 2~3개 제공

입력 설명:
- 맥락: ${input.description}
- 참여자: ${input.audience ?? "미정"}
- 목표: ${input.desiredOutcome ?? "미정"}

출력(JSON):
{
  "primary": "친목/파티",
  "secondary": ["콘텐츠"],
  "rationale": "...",
  "guidance": ["...", "..."]
}

JSON만 반환해.
  `.trim();
}

export const searchSituationTool = tool({
  description:
    "문제집이 사용될 맥락을 친목/파티, 학습/평가, 팀빌딩/교육, 콘텐츠 중에서 분류하고 실행 팁을 제공합니다.",
  inputSchema: searchSituationInputSchema,
  execute: async (rawInput) => {
    const input = searchSituationInputSchema.parse(rawInput);
    const prompt = buildPrompt(input);

    try {
      const { object } = await generateObject({
        model: openai("gpt-4o"),
        schema: situationSelectionSchema,
        prompt,
      });

      const primary =
        object.primary && situationGuides[object.primary]
          ? object.primary
          : fallbackSituation(input).primary;

      const secondary = object.secondary?.filter(
        (item): item is keyof typeof situationGuides =>
          item !== primary && Boolean(situationGuides[item]),
      );

      return {
        primary,
        secondary: secondary && secondary.length ? secondary : undefined,
        rationale: object.rationale,
        guidance: object.guidance?.length
          ? object.guidance
          : situationGuides[primary],
      };
    } catch (error) {
      console.warn("searchSituationTool: fallback due to error", error);
      return fallbackSituation(input);
    }
  },
});

