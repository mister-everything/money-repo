"use server";

import { categoryService, workBookService } from "@service/solves";
import {
  BlockType,
  WORKBOOK_DESCRIPTION_MAX_LENGTH,
  WORKBOOK_TITLE_MAX_LENGTH,
  WorkBookBlock,
} from "@service/solves/shared";
import { generateUUID } from "@workspace/util";
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import z from "zod";
import { getChatModel } from "@/lib/ai/model";
import { WorkBookInstantGeneratePrompt } from "@/lib/ai/prompt";
import { loadGenerateBlockTools } from "@/lib/ai/tools/workbook/generate-block-tools";
import {
  GEN_BLOCK_TOOL_NAMES,
  mcqMultipleToolInputToBlock,
  mcqToolInputToBlock,
  oxToolInputToBlock,
  rankingToolInputToBlock,
  subjectiveToolInputToBlock,
} from "@/lib/ai/tools/workbook/shared";
import { getSession } from "@/lib/auth/server";
import { MAX_BLOCK_COUNT } from "@/lib/const";
import { fail, ok } from "@/lib/protocol/interface";
import { safeAction } from "@/lib/protocol/server-action";

export const generateAndSaveWorkbookAction = safeAction(
  z.object({
    categoryId: z.number().min(1, "카테고리를 선택해주세요."),
    blockTypes: z.array(z.string()).optional(),
    situation: z.string().optional(),
    ageGroup: z.string().optional(),
    prompt: z.string().min(1, "프롬프트를 입력해주세요."),
  }),
  async ({ categoryId, blockTypes, situation, ageGroup, prompt }) => {
    const session = await getSession();
    const category = await categoryService.getById(categoryId);
    if (!category) {
      return fail("카테고리를 찾을 수 없습니다.");
    }

    // 1) 문제집 기본 생성 (임시 제목/설명)
    const tempTitle = `${category.name} AI 문제집`;
    const tempDescription = prompt.slice(0, WORKBOOK_DESCRIPTION_MAX_LENGTH);
    const workbook = await workBookService.createWorkBook({
      title: tempTitle,
      ownerId: session.user.id,
      categoryId,
    });

    // 2) AI 호출 (기존 프롬프트/도구 구성 재사용)
    const systemPrompt = WorkBookInstantGeneratePrompt({
      category,
      blockTypes: blockTypes as BlockType[],
      situation: situation ?? "",
      ageGroup: ageGroup ?? "",
      userName: session.user.nickname || session.user.name,
      title: tempTitle,
      description: tempDescription,
      serializeBlocks: [],
    });

    const tools = loadGenerateBlockTools(blockTypes as BlockType[]);

    // 사용자 메시지에 명확한 지시 추가
    const userMessage = `${prompt.trim()}\n\n위 요청에 맞는 문제를 즉시 생성해주세요. 문제 생성 도구를 사용하여 바로 문제를 만들어주세요.`;

    const uiMessages: UIMessage[] = [
      {
        id: generateUUID(),
        role: "user",
        parts: [
          {
            type: "text",
            text: userMessage,
          },
        ],
      },
    ];

    const result = streamText({
      model: getChatModel({
        provider: "xai",
        model: "grok-4.1-fast-non-reasoning",
      }),
      messages: convertToModelMessages(uiMessages),
      system: systemPrompt,
      maxRetries: 1,
      stopWhen: stepCountIs(10),
      tools,
    });

    const toolCalls: Array<{ toolName: string; input: any }> = [];
    for await (const part of result.fullStream) {
      if (part.type === "tool-call") {
        toolCalls.push({ toolName: part.toolName, input: part.input });
      }
    }

    const blocks: WorkBookBlock[] = [];
    for (const toolCall of toolCalls) {
      const id = generateUUID();
      let block: WorkBookBlock | null = null;

      switch (toolCall.toolName) {
        case GEN_BLOCK_TOOL_NAMES.MCQ:
          block = mcqToolInputToBlock({ id, input: toolCall.input });
          break;
        case GEN_BLOCK_TOOL_NAMES.MCQ_MULTIPLE:
          block = mcqMultipleToolInputToBlock({ id, input: toolCall.input });
          break;
        case GEN_BLOCK_TOOL_NAMES.SUBJECTIVE:
          block = subjectiveToolInputToBlock({ id, input: toolCall.input });
          break;
        case GEN_BLOCK_TOOL_NAMES.RANKING:
          block = rankingToolInputToBlock({ id, input: toolCall.input });
          break;
        case GEN_BLOCK_TOOL_NAMES.OX:
          block = oxToolInputToBlock({ id, input: toolCall.input });
          break;
      }

      if (block) blocks.push(block);
      if (blocks.length >= MAX_BLOCK_COUNT) break;
    }

    if (!blocks.length) {
      await workBookService.deleteWorkBook(workbook.id);
      return fail(
        "문제 생성에 실패했습니다. 프롬프트를 더 구체적으로 작성해주세요.",
      );
    }

    blocks.forEach((block, index) => {
      block.order = index + 1;
    });

    // 3) 제목/설명 보강 (최소 길이 확보)
    const finalTitle =
      prompt.slice(0, WORKBOOK_TITLE_MAX_LENGTH).trim() ||
      tempTitle.slice(0, WORKBOOK_TITLE_MAX_LENGTH);
    const finalDescription =
      prompt.slice(0, WORKBOOK_DESCRIPTION_MAX_LENGTH).trim() ||
      tempDescription.slice(0, WORKBOOK_DESCRIPTION_MAX_LENGTH);

    await workBookService.updateWorkBook({
      id: workbook.id,
      title: finalTitle,
      description: finalDescription,
    });

    // 4) 블록 저장
    await workBookService.processUpdateBlocks(workbook.id, {
      deleteBlocks: [],
      insertBlocks: blocks,
      updateBlocks: [],
    });

    // 5) 바로 풀 수 있도록 발행(비공개 유지: isPublic 기본값 활용)
    await workBookService.publishWorkbook({
      workBookId: workbook.id,
      userId: session.user.id,
      tags: undefined,
    });

    return ok({ workbookId: workbook.id });
  },
);
