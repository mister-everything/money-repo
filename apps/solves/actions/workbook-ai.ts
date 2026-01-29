"use server";

import { aiPriceService, categoryService } from "@service/solves";
import {
  AssistantMessageMetadata,
  BlockType,
  calculateCost,
  WorkBookBlock,
} from "@service/solves/shared";
import { generateUUID } from "@workspace/util";
import { convertToModelMessages, generateObject, UIMessage } from "ai";
import z from "zod";
import {
  generateWorkbookPlanInputSchema,
  generateWorkbookPlanQuestionInputSchema,
} from "@/app/api/ai/shared";
import { getChatModel } from "@/lib/ai/model";
import {
  CreateBlockWithPlanPrompt,
  CreateWorkbookPlanPrompt,
  CreateWorkbookPlanQuestionsPrompt,
} from "@/lib/ai/prompt";
import { getTokens } from "@/lib/ai/shared";
import { askQuestionInputSchema } from "@/lib/ai/tools/workbook/ask-question-tools";
import { getGenerateBlockInputSchema } from "@/lib/ai/tools/workbook/generate-block-tools";
import {
  mcqMultipleToolInputToBlock,
  mcqToolInputToBlock,
  oxToolInputToBlock,
  rankingToolInputToBlock,
  subjectiveToolInputToBlock,
} from "@/lib/ai/tools/workbook/shared";
import {
  blockPlanItemSchema,
  workbookPlanSchema,
} from "@/lib/ai/tools/workbook/workbook-plan";
import { getSession } from "@/lib/auth/server";
import { createLogger } from "@/lib/logger";
import { fail } from "@/lib/protocol/interface";
import { safeAction } from "@/lib/protocol/server-action";

const logger = createLogger("instant-solve");

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

    logger.debug(planningPrompt);

    const messages: UIMessage[] = [
      {
        id: generateUUID(),
        role: "user",
        parts: [
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ];
    const hasAskAnswers = askQuestion?.output?.answers?.length > 0;

    if (hasAskAnswers) {
      const questionsText = askQuestion?.input?.questions
        ?.map((q, index) => {
          return `## ${index + 1}. ${q.prompt}\n${q.options.map((o) => `- ${o.label}`).join("\n")}`;
        })
        .join("\n\n");

      const answerText = askQuestion?.input?.questions
        ?.map((q, index) => {
          const answer = askQuestion?.output?.answers?.find(
            (a) => a.questionId === q.id,
          );
          return `- ${index + 1}. ${
            answer?.selectedOptionIds?.length
              ? JSON.stringify(
                  answer.selectedOptionIds.map(
                    (id) => q.options.find((o) => o.id === id)?.label,
                  ),
                )
              : "SKIPPED"
          }`;
        })
        .filter(Boolean)
        .join("\n");

      messages.push(
        {
          id: generateUUID(),
          role: "assistant",
          parts: [
            {
              type: "text",
              text: `원하시는 문제집을 만들기위해 몇가지 추가 질문을 드릴게요.\n\n${questionsText}`,
            },
          ],
        },
        {
          id: generateUUID(),
          role: "user",
          parts: [
            {
              type: "text",
              text: `${answerText}\n\n${askQuestion?.output?.additionalMessage ?? ""}`.trim(),
            },
          ],
        },
      );
    }

    const result = await generateObject({
      model: getChatModel(model),
      schema: workbookPlanSchema,
      system: planningPrompt,
      messages: convertToModelMessages(messages),
      maxRetries: 1,
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

    logger.debug(planningPrompt);

    const result = await generateObject({
      model: getChatModel(model),
      schema: askQuestionInputSchema,
      system: planningPrompt,
      maxRetries: 1,
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

const InstantBlockRequestSchema = z.object({
  plan: workbookPlanSchema.omit({ blockPlans: true }),
  blockPlan: blockPlanItemSchema,
  categoryId: z.number(),
  previousBlocks: z.array(z.string()).optional(),
  model: z.object({
    provider: z.string(),
    model: z.string(),
  }),
});

export const generateBlockByPlanAction = safeAction(
  InstantBlockRequestSchema,
  async ({ blockPlan, categoryId, model, plan, previousBlocks }) => {
    const category = await categoryService.getById(categoryId);
    if (!category) {
      return fail("카테고리를 찾을 수 없습니다.");
    }

    const price = await aiPriceService.getActivePriceByProviderAndModelName(
      model.provider,
      model.model,
    );
    if (!price) {
      return fail("가격을 찾을 수 없습니다.");
    }

    const systemPrompt = CreateBlockWithPlanPrompt({
      plan,
      previousBlocks,
    });

    logger.debug(systemPrompt);

    const schema = getGenerateBlockInputSchema(blockPlan.type);

    const response = await generateObject({
      model: getChatModel(model),
      schema,
      system: systemPrompt,
      prompt: JSON.stringify({ blockPlan }),
      maxRetries: 1,
    });

    const { inputTokens, outputTokens } = getTokens(response.usage);
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
      block: toolResultToBlock(blockPlan.type, response.object),
      metadata,
    };
  },
);

function toolResultToBlock(type: BlockType, input: any): WorkBookBlock {
  const id = generateUUID();
  switch (type) {
    case "mcq":
      return mcqToolInputToBlock({ id, input });
    case "mcq-multiple":
      return mcqMultipleToolInputToBlock({ id, input });
    case "ranking":
      return rankingToolInputToBlock({ id, input });
    case "ox":
      return oxToolInputToBlock({ id, input });
    case "default":
      return subjectiveToolInputToBlock({ id, input });
  }
}
