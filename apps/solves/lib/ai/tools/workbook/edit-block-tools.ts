import { BlockType } from "@service/solves/shared";
import { tool as createTool, Tool } from "ai";
import z from "zod";
import {
  AnswerSchemas,
  ContentSchemas,
  EDIT_BLOCK_TOOL_NAMES,
  EDIT_FIELD_TOOL_NAMES,
  EditDefaultInputSchema,
  EditMcqInputSchema,
  EditMcqMultipleInputSchema,
  EditOxInputSchema,
  EditQuestionInputSchema,
  EditRankingInputSchema,
  EditSolutionInputSchema,
} from "./shared";

// 1. Question Tool
export const editQuestionTool: Tool = createTool({
  name: EDIT_FIELD_TOOL_NAMES.QUESTION,
  description: "질문 수정을 도와줍니다.",
  inputSchema: EditQuestionInputSchema,
});
// 2. Content Tool
export function createEditContentTool(blockType: BlockType): Tool {
  const schema = ContentSchemas[blockType] ?? z.object({});
  return createTool({
    name: EDIT_FIELD_TOOL_NAMES.CONTENT,
    description: "문제의 보기/내용을 수정합니다.",
    inputSchema: schema,
  });
}

// 3. Answer Tool
export function createEditAnswerTool(blockType: BlockType): Tool {
  const schema = AnswerSchemas[blockType];
  if (!schema) throw new Error(`Unknown block type: ${blockType}`);
  return createTool({
    name: EDIT_FIELD_TOOL_NAMES.ANSWER,
    description: "문제의 정답을 수정합니다.",
    inputSchema: schema,
  });
}

// 4. Solution Tool
export const editSolutionTool: Tool = createTool({
  name: EDIT_FIELD_TOOL_NAMES.SOLUTION,
  description: "문제의 해설을 수정합니다.",
  inputSchema: EditSolutionInputSchema,
});

/**
 * 객관식(단일) 수정 툴
 * input: 질문, 보기 문자열, 정답 인덱스, 선택적 해설
 */
export const editMcqBlockTool: Tool = createTool({
  name: EDIT_BLOCK_TOOL_NAMES.MCQ,
  description: "객관식 문제 수정을 도와줍니다.",
  inputSchema: EditMcqInputSchema,
});

/**
 * 객관식(다중) 수정 툴
 * input: 질문, 보기 문자열, 정답 인덱스 배열, 선택적 해설
 */
export const editMcqMultipleBlockTool: Tool = createTool({
  name: EDIT_BLOCK_TOOL_NAMES.MCQ_MULTIPLE,
  description: "객관식 문제 수정을 도와줍니다.",
  inputSchema: EditMcqMultipleInputSchema,
});

/**
 * 주관식 수정 툴
 * input: 질문, 정답 문자열, 선택적 해설
 */
export const editDefaultBlockTool: Tool = createTool({
  name: EDIT_BLOCK_TOOL_NAMES.DEFAULT,
  description: "주관식 문제 수정을 도와줍니다.",
  inputSchema: EditDefaultInputSchema,
});

/**
 * 순위 수정 툴
 * input: 질문, 보기 문자열, 정답 인덱스 배열, 선택적 해설
 */
export const editRankingBlockTool: Tool = createTool({
  name: EDIT_BLOCK_TOOL_NAMES.RANKING,
  description: "순위 문제 수정을 도와줍니다.",
  inputSchema: EditRankingInputSchema,
});

/**
 * 오답 수정 툴
 * input: 질문, 정답 문자열, 선택적 해설
 */
export const editOxBlockTool: Tool = createTool({
  name: EDIT_BLOCK_TOOL_NAMES.OX,
  description: "오답 문제 수정을 도와줍니다.",
  inputSchema: EditOxInputSchema,
});
