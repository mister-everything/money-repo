import { convertToModelMessages, streamText } from "ai";
import { getChatModel } from "@/lib/ai/model";
import {
  editMcqBlockTool,
  editMcqMultipleBlockTool,
  editOxBlockTool,
  editRankingBlockTool,
  editSubjectiveBlockTool,
} from "@/lib/ai/tools/workbook/edit-block-tools";
import { EDIT_BLOCK_TOOL_NAMES } from "@/lib/ai/tools/workbook/shared";
import { WorkbookEditChatRequest } from "../../../shared";

export const maxDuration = 300;

const systemPrompt = (blockInfo: string) => {
  return `
    너는 문제집 수정 전문가 입니다.
    문제집의 문제를 수정해줘.
    
    문제집의 문제는 다음과 같습니다.
   
    ${blockInfo}
    `;
};
export async function POST(req: Request) {
  const { type, question, content, answer, model, messages } = await req
    .json()
    .then(WorkbookEditChatRequest.parse);

  const systemPromptText = systemPrompt(
    JSON.stringify({
      type,
      question,
      content,
      answer,
    }),
  );

  const tools = {
    [EDIT_BLOCK_TOOL_NAMES.MCQ]: editMcqBlockTool,
    [EDIT_BLOCK_TOOL_NAMES.MCQ_MULTIPLE]: editMcqMultipleBlockTool,
    [EDIT_BLOCK_TOOL_NAMES.SUBJECTIVE]: editSubjectiveBlockTool,
    [EDIT_BLOCK_TOOL_NAMES.RANKING]: editRankingBlockTool,
    [EDIT_BLOCK_TOOL_NAMES.OX]: editOxBlockTool,
  };

  const result = streamText({
    model: getChatModel(model),
    system: systemPromptText,
    toolChoice: "required",
    tools,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
