import { BlockType } from "@service/solves/shared";
import { convertToModelMessages, streamText, Tool } from "ai";
import { getChatModel } from "@/lib/ai/model";
import {
  createEditAnswerTool,
  createEditContentTool,
  editQuestionTool,
  editSolutionTool,
} from "@/lib/ai/tools/workbook/edit-block-tools";
import { EDIT_FIELD_TOOL_NAMES } from "@/lib/ai/tools/workbook/shared";
import { EditFields, WorkbookEditChatRequest } from "../../../shared";

export const maxDuration = 300;

const FIELD_DESCRIPTIONS: Record<
  EditFields,
  { name: string; description: string }
> = {
  [EditFields.QUESTION]: {
    name: "질문",
    description:
      "문제의 질문 텍스트를 수정합니다. 명확하고 이해하기 쉬운 문장으로 개선해주세요.",
  },
  [EditFields.CONTENT]: {
    name: "보기/내용",
    description:
      "객관식의 보기, 순위 문제의 항목 등 문제의 선택지를 수정합니다. 오답은 매력적이면서도 명확히 구분될 수 있게 해주세요.",
  },
  [EditFields.ANSWER]: {
    name: "정답",
    description:
      "문제의 정답을 수정합니다. 정답이 논리적으로 올바른지 확인해주세요.",
  },
  [EditFields.SOLUTION]: {
    name: "해설",
    description:
      "문제의 해설을 수정합니다. 왜 그 답이 정답인지 명확하게 설명해주세요.",
  },
};

const editFieldsPrompt = (editFields: EditFields[]) => {
  if (editFields.length === 0) {
    return null;
  }

  return editFields
    .map((field) => {
      const fieldInfo = FIELD_DESCRIPTIONS[field];
      return `- **${fieldInfo.name}** (${field}): ${fieldInfo.description}`;
    })
    .join("\n");
};

const systemPrompt = (blockInfo: string, editFields: EditFields[]) => {
  const editFieldsPromptText = editFieldsPrompt(editFields);
  const isAutoMode = !editFieldsPromptText;

  return `
    당신은 문제집 수정 전문가입니다.
    주어진 문제를 분석하고 개선해주세요.

    ## 현재 문제
    ${blockInfo}

    ## 수정 대상
    ${
      isAutoMode
        ? "모든 항목 - AI가 판단하여 필요한 부분을 자유롭게 수정"
        : `다음 항목만 수정해주세요:\n${editFieldsPromptText}`
    }

    ## 수정 지침
    ${
      isAutoMode
        ? `- 문제를 분석하고 개선이 필요한 부분을 자유롭게 수정해주세요.
    - 질문, 보기/내용, 정답, 해설 중 필요한 항목만 수정하면 됩니다.
    - 모든 항목을 반드시 수정할 필요는 없습니다.
    - 문제의 난이도와 품질을 높이는 방향으로 수정해주세요.`
        : `- 지정된 항목(${editFields.map((f) => FIELD_DESCRIPTIONS[f].name).join(", ")})만 수정해주세요.
    - 지정되지 않은 항목은 절대 건드리지 마세요.`
    }

    ## 공통 규칙
    - 기존 문제의 맥락과 의도를 유지하면서 개선해주세요.
    - 각 항목별로 해당하는 도구를 호출해주세요.
    - 수정이 불필요한 항목은 도구를 호출하지 않아도 됩니다.
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

function loadEditTools({
  type,
  editFields,
}: {
  type: BlockType;
  editFields?: EditFields[];
}) {
  const tools: Record<string, Tool> = {};
  if (!editFields) {
    return tools;
  }

  if (editFields.includes(EditFields.QUESTION)) {
    tools[EDIT_FIELD_TOOL_NAMES.QUESTION] = editQuestionTool;
  }
  if (editFields.includes(EditFields.CONTENT)) {
    tools[EDIT_FIELD_TOOL_NAMES.CONTENT] = createEditContentTool(type);
  }
  if (editFields.includes(EditFields.ANSWER)) {
    tools[EDIT_FIELD_TOOL_NAMES.ANSWER] = createEditAnswerTool(type);
  }
  if (editFields.includes(EditFields.SOLUTION)) {
    tools[EDIT_FIELD_TOOL_NAMES.SOLUTION] = editSolutionTool;
  }

  return tools;
}
