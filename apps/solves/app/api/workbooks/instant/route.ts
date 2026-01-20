import { categoryService } from "@service/solves";
import { BlockType } from "@service/solves/shared";
import { generateText, Tool } from "ai";
import z from "zod";
import { getDefaultChatModel } from "@/lib/ai/model";
import { CreateBlockWithPlanPrompt } from "@/lib/ai/prompt";
import { loadGenerateBlockTools } from "@/lib/ai/tools/workbook/generate-block-tools";
import {
  blockPlanItemSchema,
  workbookPlanSchema,
} from "@/lib/ai/tools/workbook/workbook-plan";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

export const maxDuration = 300;

const InstantBlockRequestSchema = workbookPlanSchema
  .omit({ blockPlans: true })
  .extend({
    blockPlan: blockPlanItemSchema,
    categoryId: z.number().int().min(1),
    previousBlocks: z.array(z.string()).optional(),
    model: z.object({
      provider: z.string(),
      model: z.string(),
    }),
  });

export async function POST(req: Request) {
  try {
    const {
      overview,
      blockPlan,
      constraints = [],
      guidelines = [],
      categoryId,
      previousBlocks,
    } = await req.json().then(InstantBlockRequestSchema.parse);

    const blockType = blockPlan.type as BlockType;

    const category = await categoryService.getById(categoryId);
    if (!category) {
      throw new Error("카테고리를 찾을 수 없습니다.");
    }

    const systemPrompt = CreateBlockWithPlanPrompt({
      plan: {
        overview,
        constraints,
        guidelines,
      },
      previousBlocks,
    });

    const tools: Record<string, Tool> = loadGenerateBlockTools([blockType]);

    const result = await generateText({
      model: await getDefaultChatModel(),
      system: systemPrompt,
      prompt: JSON.stringify({ blockPlan }),
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
