"use server";

import { categoryService } from "@service/solves";
import { BlockType } from "@service/solves/shared";
import { generateObject } from "ai";
import z from "zod";
import { getDefaultChatModel } from "@/lib/ai/model";
import { CreateWorkbookPlanPrompt } from "@/lib/ai/prompt";
import { workbookPlanSchema } from "@/lib/ai/tools/workbook/workbook-plan";
import { getSession } from "@/lib/auth/server";
import { MAX_BLOCK_COUNT } from "@/lib/const";
import { fail } from "@/lib/protocol/interface";
import { safeAction } from "@/lib/protocol/server-action";

const generateWorkbookPlanInputSchema = z.object({
  categoryId: z.number("카테고리를 선택해주세요"),
  blockTypes: z.array(z.string()).optional(),
  blockCount: z
    .number(`최소 1개, 최대 ${MAX_BLOCK_COUNT}개를 선택해주세요`)
    .min(1)
    .max(MAX_BLOCK_COUNT),
  prompt: z.string("프롬프트를 입력해주세요").min(1),
});

export const generateWorkbookPlanAction = safeAction(
  generateWorkbookPlanInputSchema,
  async ({ categoryId, blockTypes, blockCount, prompt }) => {
    const session = await getSession();
    const category = await categoryService.getById(categoryId);
    if (!category) {
      return fail("카테고리를 찾을 수 없습니다.");
    }
    const planningPrompt = CreateWorkbookPlanPrompt({
      category,
      blockTypes: blockTypes as BlockType[],
      blockCount,
      userName: session.user.nickname || session.user.name,
    });

    const result = await generateObject({
      model: await getDefaultChatModel(),
      schema: workbookPlanSchema,
      system: planningPrompt,
      prompt,
    });

    return {
      plan: result.object,
    };
  },
);
