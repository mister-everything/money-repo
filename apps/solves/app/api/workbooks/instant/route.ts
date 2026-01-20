import { categoryService } from "@service/solves";
import { BlockType, blockDisplayNames } from "@service/solves/shared";
import { generateText, Tool } from "ai";
import z from "zod";
import { getDefaultChatModel } from "@/lib/ai/model";
import { loadGenerateBlockTools } from "@/lib/ai/tools/workbook/generate-block-tools";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

export const maxDuration = 300;

const InstantBlockRequestSchema = z.object({
  plan: z.object({
    overview: z.object({
      title: z.string(),
      description: z.string(),
      goal: z.string(),
      targetAudience: z.string(),
      difficulty: z.string().optional(),
    }),
    blockPlans: z.array(
      z.object({
        type: z.string(), // BlockType 코드 (mcq, ox, default, ranking, mcq-multiple)
        intent: z.string(),
        learningObjective: z.string().optional(),
        expectedDifficulty: z.string().optional(),
        topic: z.string().optional(),
        notes: z.string().optional(),
      }),
    ),
    constraints: z.array(z.string()),
    guidelines: z.array(z.string()),
  }),
  blockIndex: z.number().int().min(0),
  categoryId: z.number().int().min(1),
  previousBlocks: z.array(z.string()).optional(),
  model: z.object({
    provider: z.string(),
    model: z.string(),
  }),
});

export async function POST(req: Request) {
  try {
    const { plan, blockIndex, categoryId, previousBlocks } = await req
      .json()
      .then(InstantBlockRequestSchema.parse);

    if (blockIndex >= plan.blockPlans.length) {
      throw new Error("잘못된 blockIndex입니다.");
    }

    const targetBlock = plan.blockPlans[blockIndex];
    const blockType = targetBlock.type as BlockType;

    const category = await categoryService.getById(categoryId);
    if (!category) {
      throw new Error("카테고리를 찾을 수 없습니다.");
    }

    const blockTypeLabel = blockDisplayNames[blockType] || blockType;

    const systemPrompt = `
너는 Solves AI의 문제 생성 전문가다.
주어진 문제집 플랜의 ${blockIndex + 1}번째 문제를 생성한다.

# 문제집 정보
- 제목: ${plan.overview.title}
- 설명: ${plan.overview.description}
- 목표: ${plan.overview.goal}
- 대상: ${plan.overview.targetAudience}
${plan.overview.difficulty ? `- 전체 난이도: ${plan.overview.difficulty}` : ""}
- 카테고리: ${category.name}
${category.aiPrompt ? `- 카테고리 힌트: ${category.aiPrompt}` : ""}

# 생성할 문제 정보 (${blockIndex + 1}/${plan.blockPlans.length})
- 타입: ${blockTypeLabel} (${blockType})
- 의도: ${targetBlock.intent}
${targetBlock.learningObjective ? `- 학습 목표: ${targetBlock.learningObjective}` : ""}
${targetBlock.expectedDifficulty ? `- 예상 난이도: ${targetBlock.expectedDifficulty}` : ""}
${targetBlock.topic ? `- 주제: ${targetBlock.topic}` : ""}
${targetBlock.notes ? `- 문제별 참고사항: ${targetBlock.notes}` : ""}

# 제약사항
${plan.constraints.map((c) => `- ${c}`).join("\n")}

# 가이드라인
${plan.guidelines.map((g) => `- ${g}`).join("\n")}

${
  previousBlocks && previousBlocks.length > 0
    ? `# 이미 생성된 문제들
> 아래 문제들과 중복되지 않게 할것.
${previousBlocks.map((block, idx) => `${idx + 1}. ${block}`).join("\n")}
`
    : ""
}
# 생성 규칙
- 반드시 ${blockType} 타입의 문제를 생성해야 한다.
- 문제의 의도(${targetBlock.intent})를 명확히 반영한다.
- 전체 문제집의 맥락과 흐름을 고려한다.
${previousBlocks && previousBlocks.length > 0 ? "- 이미 생성된 문제들과 중복되지 않게 할것." : ""}
- 해설은 명확하고 이해하기 쉽게 작성한다.
- 도구를 반드시 1번만 호출한다.
`.trim();

    const tools: Record<string, Tool> = loadGenerateBlockTools([blockType]);

    const result = await generateText({
      model: await getDefaultChatModel(),
      system: systemPrompt,
      prompt: `${blockIndex + 1}번 문제를 생성해주세요.`,
      toolChoice: "required",
      tools,
      maxRetries: 1,
    });

    const steps = result.steps;
    if (!steps || steps.length === 0) {
      throw new Error("문제 생성에 실패했습니다.");
    }

    const toolStep = steps.find((step) => step.toolCalls?.length);
    if (!toolStep) {
      throw new Error("문제 생성 도구 호출 정보를 찾을 수 없습니다.");
    }

    const toolCall = toolStep.toolCalls?.[0];
    if (!toolCall) {
      throw new Error("문제 생성 도구 호출에 실패했습니다.");
    }

    return nextOk(toolCall.input);
  } catch (error) {
    console.error("Instant block generation error:", error);
    return nextFail(error);
  }
}
