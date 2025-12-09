import { openai } from "@ai-sdk/openai";
import { generateObject, Tool, tool } from "ai";
import { z } from "zod";

// 문제 타입별 스키마 정의 (순환 참조 회피를 위해 agent에서 직접 정의)
const defaultBlockContentSchema = z.object({
  type: z.literal("default"),
  question: z.string().optional(),
});

const defaultBlockAnswerSchema = z.object({
  type: z.literal("default"),
  answer: z.array(z.string()).min(1),
});

const mcqBlockContentOptionSchema = z.union([
  z.object({
    type: z.literal("source"),
    mimeType: z.string(),
    url: z.string().url(),
  }),
  z.object({
    type: z.literal("text"),
    text: z.string().min(1),
  }),
]);

const mcqBlockContentSchema = z.object({
  type: z.literal("mcq"),
  question: z.string().optional(),
  options: mcqBlockContentOptionSchema.array().min(2),
});

const mcqBlockAnswerSchema = z.object({
  type: z.literal("mcq"),
  answer: z.array(z.number().int().min(0)).min(1),
});

const rankingBlockItemSchema = z.union([
  z.object({
    id: z.string(),
    type: z.literal("text"),
    label: z.string().min(1),
  }),
  z.object({
    id: z.string(),
    type: z.literal("source"),
    mimeType: z.string(),
    url: z.string().url(),
  }),
]);

const rankingBlockContentSchema = z.object({
  type: z.literal("ranking"),
  question: z.string().optional(),
  items: rankingBlockItemSchema.array().min(2),
});

const rankingBlockAnswerSchema = z.object({
  type: z.literal("ranking"),
  order: z.array(z.string()).min(2),
});

const oxBlockOptionSchema = z.union([
  z.object({
    type: z.literal("source"),
    mimeType: z.string(),
    url: z.string().url(),
  }),
  z.object({
    type: z.literal("text"),
    text: z.string().min(1),
  }),
]);

const oxBlockContentSchema = z.object({
  type: z.literal("ox"),
  question: z.string().optional(),
  oOption: oxBlockOptionSchema,
  xOption: oxBlockOptionSchema,
});

const oxBlockAnswerSchema = z.object({
  type: z.literal("ox"),
  answer: z.enum(["o", "x"]),
});

const matchingBlockLeftItemSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
  imageUrl: z.string().url().optional(),
});

const matchingBlockRightItemSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
  imageUrl: z.string().url().optional(),
});

const matchingBlockContentSchema = z.object({
  type: z.literal("matching"),
  question: z.string().optional(),
  leftItems: matchingBlockLeftItemSchema.array().min(2),
  rightItems: matchingBlockRightItemSchema.array().min(2),
});

const matchingPairSchema = z.object({
  leftId: z.string(),
  rightId: z.string(),
});

const matchingBlockAnswerSchema = z.object({
  type: z.literal("matching"),
  pairs: matchingPairSchema.array().min(1),
});

// 문제집 저장 스키마
const workBookSaveSchema = z.object({
  id: z.number().optional(),
  ownerId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  blocks: z.array(
    z.object({
      id: z.number().optional(),
      type: z.enum(["default", "mcq", "ranking", "ox", "matching"]),
      question: z.string().optional(),
      content: z.union([
        defaultBlockContentSchema,
        mcqBlockContentSchema,
        rankingBlockContentSchema,
        oxBlockContentSchema,
        matchingBlockContentSchema,
      ]),
      answer: z
        .union([
          defaultBlockAnswerSchema,
          mcqBlockAnswerSchema,
          rankingBlockAnswerSchema,
          oxBlockAnswerSchema,
          matchingBlockAnswerSchema,
        ])
        .optional(),
      tags: z.array(z.string()).optional(),
      order: z.number().optional(),
    }),
  ),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  thumbnail: z.string().optional(),
});

/**
 * 문제집/퀴즈 생성 도구
 * AI가 사용자의 요구사항을 받아서 다양한 콘텐츠 JSON을 생성합니다.
 */
export const generateWorkBookTool: Tool = tool({
  description: `
사용자의 요구사항에 따라 문제집/퀴즈 JSON을 생성합니다.

교육용부터 재미 콘텐츠까지 모두 지원:
- 교육용: "중학교 1학년 수학 문제집 10개", "고등학교 영어 단어 퀴즈"
- 재미용: "음식 이상형 월드컵 16강", "넌센스 퀴즈 20개", "밸런스 게임 10개"
- 투표: "2024 인기 드라마 순위 투표", "최애 캐릭터 OX 투표"

생성된 JSON은 API에 바로 전송 가능한 형태입니다.
  `.trim(),
  inputSchema: z.object({
    requirement: z
      .string()
      .describe(
        "사용자의 요구사항 (예: '중학교 1학년 수학 문제집', '음식 이상형 월드컵 16강', '넌센스 퀴즈 20개')",
      ),
    problemCount: z
      .number()
      .min(1)
      .max(50)
      .default(10)
      .describe("생성할 문제 수 (기본 10개, 최대 50개)"),
    includeAnswers: z
      .boolean()
      .default(true)
      .describe(
        "정답 포함 여부 (교육용은 true, 이상형 월드컵 같은 재미 콘텐츠는 false 가능)",
      ),
    difficulty: z
      .enum(["easy", "medium", "hard"])
      .default("medium")
      .describe("문제 난이도 또는 콘텐츠 복잡도 (easy, medium, hard)"),
  }),
  execute: async ({
    requirement,
    problemCount,
    includeAnswers,
    difficulty,
  }) => {
    try {
      // AI를 사용해 실제 문제집 생성
      const result = await generateObject({
        model: openai("gpt-4o"),
        schema: workBookSaveSchema,
        prompt: `
당신은 다양한 퀴즈/문제집 콘텐츠 생성 전문가입니다. 다음 요구사항에 맞는 콘텐츠를 생성하세요:

**요구사항:**
- 주제: ${requirement}
- 문제 수: ${problemCount}개
- 난이도/복잡도: ${difficulty === "easy" ? "쉬움" : difficulty === "medium" ? "보통" : "어려움"}
- 정답 포함: ${includeAnswers ? "예" : "아니오"}

**사용 가능한 문제 타입:**
1. default (주관식): 단답형, 주관식 답변
2. mcq (객관식): 선택형 문제 (2개 이상의 선택지)
3. ox (OX퀴즈): 참/거짓, 양자택일
4. ranking (순위): 순서 맞추기, 순위 정하기
5. matching (매칭): 항목 연결, 짝 맞추기

**주제 분석 후 자유롭게 구성:**
- 주제의 특성을 파악하고 가장 재미있고 적합한 문제 타입을 자유롭게 선택하세요
- 한 가지 타입만 사용할 필요 없음, 여러 타입을 섞어도 좋습니다
- 교육용이든 재미용이든 사용자가 즐길 수 있는 최적의 형태로 구성하세요

**기본 지침:**
1. ownerId는 "USER_ID_PLACEHOLDER"로 설정
2. tags는 주제에 맞는 태그 3-5개 추가
3. **중요**: 정답 포함이 "아니오"면 answer 필드를 아예 포함하지 마세요 (필드 자체 제거)
4. 문제는 흥미롭고 창의적으로 구성하세요

**문제 타입별 JSON 형식:**
- default: { type: "default", question: "..." } / answer: { type: "default", answer: ["..."] }
- mcq: { type: "mcq", question: "...", options: [{ type: "text", text: "..." }...] } / answer: { type: "mcq", answer: [인덱스] }
- ox: { type: "ox", question: "...", oOption: {...}, xOption: {...} } / answer: { type: "ox", answer: "o" or "x" }
- ranking: { type: "ranking", question: "...", items: [{ id: "...", type: "text", label: "..." }...] } / answer: { type: "ranking", order: ["id"...] }
- matching: { type: "matching", question: "...", leftItems: [...], rightItems: [...] } / answer: { type: "matching", pairs: [{...}...] }

콘텐츠를 생성하세요.
        `.trim(),
      });

      return {
        workBook: result.object,
        message: `✅ "${requirement}" 주제로 ${problemCount}개의 문제를 생성했습니다!\n\n📋 **생성된 문제집:**\n- 제목: ${result.object.title}\n- 문제 수: ${result.object.blocks.length}개\n- 태그: ${result.object.tags?.join(", ") || "없음"}\n\n💡 **다음 단계:**\n1. 프론트엔드에서 JSON을 확인하고 수정\n2. ownerId를 실제 사용자 ID로 교체\n3. POST /api/prob-books API로 전송`,
      };
    } catch (error) {
      console.error("문제집 생성 중 오류:", error);
      return {
        workBook: {
          title: requirement,
          description: `${requirement} 관련 문제집`,
          ownerId: "USER_ID_PLACEHOLDER",
          isPublic: false,
          tags: [],
          blocks: [],
        },
        message: `❌ 문제집 생성 중 오류가 발생했습니다: ${error}`,
      };
    }
  },
});
