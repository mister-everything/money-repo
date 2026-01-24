"use server";

import { aiPriceService, categoryService } from "@service/solves";
import {
  AssistantMessageMetadata,
  BlockType,
  calculateCost,
} from "@service/solves/shared";
import { generateObject } from "ai";

import {
  generateWorkbookPlanInputSchema,
  generateWorkbookPlanQuestionInputSchema,
} from "@/app/api/ai/shared";
import { getChatModel } from "@/lib/ai/model";
import {
  CreateWorkbookPlanPrompt,
  CreateWorkbookPlanQuestionsPrompt,
} from "@/lib/ai/prompt";
import { getTokens } from "@/lib/ai/shared";
import { askQuestionInputSchema } from "@/lib/ai/tools/workbook/ask-question-tools";
import { workbookPlanSchema } from "@/lib/ai/tools/workbook/workbook-plan";
import { getSession } from "@/lib/auth/server";
import { fail } from "@/lib/protocol/interface";
import { safeAction } from "@/lib/protocol/server-action";

export const generateWorkbookPlanAction = safeAction(
  generateWorkbookPlanInputSchema,
  async ({
    categoryId,
    blockTypes,
    blockCount,
    prompt,
    model,
    askQuestion,
  }) => {
    const session = await getSession();
    const category = await categoryService.getById(categoryId);
    const price = await aiPriceService.getActivePriceByProviderAndModelName(
      model.provider,
      model.model,
    );
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
      model: getChatModel(model),
      schema: workbookPlanSchema,
      system: planningPrompt,
      prompt,
    });
    const { inputTokens, outputTokens } = getTokens(result.usage);
    const metadata: AssistantMessageMetadata = {
      input: inputTokens,
      output: outputTokens,
      provider: model.provider,
      model: model.model,
      cost: Number(
        calculateCost(price!, {
          input: inputTokens,
          output: outputTokens,
        }).totalMarketCost.toFixed(6),
      ),
    };
    return {
      plan: result.object,
      metadata,
    };
  },
);

export const generateWorkbookPlanQuestionAction = safeAction(
  generateWorkbookPlanQuestionInputSchema,
  async ({ categoryId, blockTypes, blockCount, prompt, model }) => {
    const session = await getSession();
    const category = await categoryService.getById(categoryId);
    const price = await aiPriceService.getActivePriceByProviderAndModelName(
      model.provider,
      model.model,
    );
    if (!category) {
      return fail("카테고리를 찾을 수 없습니다.");
    }

    const planningPrompt = CreateWorkbookPlanQuestionsPrompt({
      category,
      blockCount,
      userName: session.user.nickname || session.user.name,
    });

    const result = await generateObject({
      model: getChatModel(model),
      schema: askQuestionInputSchema,
      system: planningPrompt,
      prompt,
    });
    const { inputTokens, outputTokens } = getTokens(result.usage);
    const metadata: AssistantMessageMetadata = {
      input: inputTokens,
      output: outputTokens,
      provider: model.provider,
      model: model.model,
      cost: Number(
        calculateCost(price!, {
          input: inputTokens,
          output: outputTokens,
        }).totalMarketCost.toFixed(6),
      ),
    };
    return {
      question: result.object,
      metadata,
    };
  },
);
