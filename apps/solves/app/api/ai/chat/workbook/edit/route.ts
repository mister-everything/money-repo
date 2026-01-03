import { convertToModelMessages, streamText, Tool } from "ai";
import { getChatModel } from "@/lib/ai/model";
import { EditFields, WorkbookEditChatRequest } from "../../../shared";
import { EDIT_FIELD_TOOL_NAMES } from "@/lib/ai/tools/workbook/shared";
import { editQuestionTool } from "@/lib/ai/tools/workbook/edit-block-tools";

export const maxDuration = 300;

const editFieldsPrompt = (editFields: EditFields[]) => {
  if (editFields.length === 0) {
    return null;
  }
  return editFields
    .map((field) => {
      return `
      ${field}
    `;
    })
    .join("\n");
};

const systemPrompt = (blockInfo: string, editFields: EditFields[]) => {
  const editFieldsPromptText = editFieldsPrompt(editFields);

  return `
    당신은 문제집 수정 전문가 입니다.
    문제집의 문제를 수정해줘.
    
    문제집의 문제는 다음과 같습니다.
  
    ${blockInfo}

    ## 수정 대상
    ${editFieldsPromptText ? "모든 항목 (AI가 판단하여 필요한 부분 수정)" : editFieldsPromptText}

    ## 지침
    ${
      editFieldsPromptText
        ? `- 문제를 분석하고 개선이 필요한 부분을 자유롭게 수정해주세요.
    - 질문, 보기/내용, 정답, 해설 중 필요한 항목만 수정하면 됩니다.
    - 모든 항목을 수정할 필요는 없습니다.`
        : `- 수정 요청된 항목(${editFields.join(", ")})만 수정해주세요.
    - 다른 항목은 건드리지 마세요.`
    }
    - 기존 문제의 맥락과 의도를 유지하면서 개선해주세요.
    - 각 항목별로 해당하는 도구를 호출해주세요.
    `;
};

export async function POST(req: Request) {
  const { type, question, content, answer, model, messages, editFields } =
    await req.json().then(WorkbookEditChatRequest.parse);

  const systemPromptText = systemPrompt(
    JSON.stringify({
      type,
      question,
      content,
      answer,
      solution: answer.solution,
    }),
    editFields ?? [],
  );

  const tools = loadEditTools({
    type,
    editFields,
  });

  const result = streamText({
    model: getChatModel(model),
    system: systemPromptText,
    toolChoice: "required",
    tools,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

function loadEditTools({ blockType, editFields }: LoadEditToolsParams) {
  const tools: Record<string, Tool> = {};

  if (editFields.includes("question")) {
    tools[EDIT_FIELD_TOOL_NAMES.QUESTION] = editQuestionTool;
  }
  if (editFields.includes("content")) {
    tools[EDIT_FIELD_TOOL_NAMES.CONTENT] = createEditContentTool(blockType);
  }
  if (editFields.includes("answer")) {
    tools[EDIT_FIELD_TOOL_NAMES.ANSWER] = createEditAnswerTool(blockType);
  }
  if (editFields.includes("solution")) {
    tools[EDIT_FIELD_TOOL_NAMES.SOLUTION] = editSolutionTool;
  }

  return tools;
}