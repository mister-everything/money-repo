import { Tool, tool } from "ai";
import {
  EDIT_BLOCK_TOOL_NAMES,
  EditMcqInputSchema,
  EditMcqMultipleInputSchema,
  EditOxInputSchema,
  EditRankingInputSchema,
  EditSubjectiveInputSchema,
} from "./shared";

/**
 * 객관식(단일) 수정 툴
 * input: 질문, 보기 문자열, 정답 인덱스, 선택적 해설
 */
export const editMcqBlockTool: Tool = tool({
  name: EDIT_BLOCK_TOOL_NAMES.MCQ,
  description: "객관식 문제 수정을 도와줍니다.",
  inputSchema: EditMcqInputSchema,
});

/**
 * 객관식(다중) 수정 툴
 * input: 질문, 보기 문자열, 정답 인덱스 배열, 선택적 해설
 */
export const editMcqMultipleBlockTool: Tool = tool({
  name: EDIT_BLOCK_TOOL_NAMES.MCQ_MULTIPLE,
  description: "객관식 문제 수정을 도와줍니다.",
  inputSchema: EditMcqMultipleInputSchema,
});

/**
 * 주관식 수정 툴
 * input: 질문, 정답 문자열, 선택적 해설
 */
export const editSubjectiveBlockTool: Tool = tool({
  name: EDIT_BLOCK_TOOL_NAMES.SUBJECTIVE,
  description: "주관식 문제 수정을 도와줍니다.",
  inputSchema: EditSubjectiveInputSchema,
});

/**
 * 순위 수정 툴
 * input: 질문, 보기 문자열, 정답 인덱스 배열, 선택적 해설
 */
export const editRankingBlockTool: Tool = tool({
  name: EDIT_BLOCK_TOOL_NAMES.RANKING,
  description: "순위 문제 수정을 도와줍니다.",
  inputSchema: EditRankingInputSchema,
});

/**
 * 오답 수정 툴
 * input: 질문, 정답 문자열, 선택적 해설
 */
export const editOxBlockTool: Tool = tool({
  name: EDIT_BLOCK_TOOL_NAMES.OX,
  description: "오답 문제 수정을 도와줍니다.",
  inputSchema: EditOxInputSchema,
});
