/**
 * AI tool registry
 *
 * LLM이 호출하는 도구이므로 입력 스키마를 최소화하고,
 * DB id 등의 불필요한 값은 포함하지 않는다.
 */

import { All_BLOCKS, BlockType } from "@service/solves/shared";
import { generateUUID, wait } from "@workspace/util";
import { tool as createTool, Tool } from "ai";

import {
  GEN_BLOCK_TOOL_NAMES,
  GenerateMcqInputSchema,
  GenerateMcqMultipleInputSchema,
  GenerateOxInputSchema,
  GenerateRankingInputSchema,
  GenerateSubjectiveInputSchema,
} from "./shared";

const TOOL_DELAY = 3000; // 고의적으로 지연시간을 줘서 툴 사용 효과를 확인할 수 있도록

/**
 * 객관식(단일) 생성 툴
 * input: 질문, 보기 문자열, 정답 인덱스, 선택적 해설
 * output: client 측에서 input 문제를 생성할 수 있기 때문에 별도 output 은 필요 없음 context 절약
 */
export const generateMcqTool: Tool = createTool({
  name: GEN_BLOCK_TOOL_NAMES.MCQ,
  description: "객관식 문제를 생성합니다.",
  inputSchema: GenerateMcqInputSchema,
  execute: async ({ options, correctOptionIndex }) => {
    if (correctOptionIndex < 0 || correctOptionIndex >= options.length) {
      throw new Error("correctOptionIndex 범위를 확인하세요.");
    }

    await wait(TOOL_DELAY);
    const id = generateUUID();
    return {
      id,
    };
  },
});

/**
 * 객관식(다중) 생성 툴
 * input: 질문, 보기 문자열, 정답 인덱스 배열, 선택적 해설
 * output: client 측에서 input 문제를 생성할 수 있기 때문에 별도 output 은 필요 없음 context 절약
 */
export const generateMcqMultipleTool: Tool = createTool({
  name: GEN_BLOCK_TOOL_NAMES.MCQ_MULTIPLE,
  description: "객관식 문제를 생성합니다.",
  inputSchema: GenerateMcqMultipleInputSchema,
  execute: async () => {
    await wait(TOOL_DELAY);
    const id = generateUUID();
    return {
      id,
    };
  },
});

/**
 * 주관식 생성 툴
 * input: 질문, 정답 후보 문자열 배열, 선택적 해설
 * output: client 측에서 input 문제를 생성할 수 있기 때문에 별도 output 은 필요 없음 context 절약
 */
export const generateSubjectiveTool: Tool = createTool({
  name: GEN_BLOCK_TOOL_NAMES.SUBJECTIVE,
  description: "주관식 문제를 생성합니다.",
  inputSchema: GenerateSubjectiveInputSchema,
  execute: async () => {
    await wait(TOOL_DELAY);
    const id = generateUUID();
    return {
      id,
    };
  },
});

/**
 * 랭킹 생성 툴
 * input: 질문, 순위 항목 문자열 배열, 선택적 해설
 * output: client 측에서 input 문제를 생성할 수 있기 때문에 별도 output 은 필요 없음 context 절약
 */
export const generateRankingTool: Tool = createTool({
  name: GEN_BLOCK_TOOL_NAMES.RANKING,
  description: "순위 문제를 생성합니다.",
  inputSchema: GenerateRankingInputSchema,
  execute: async () => {
    await wait(TOOL_DELAY);
    const id = generateUUID();
    return {
      id,
    };
  },
});

/**
 * OX 생성 툴
 * input: 질문, 정답 문자열, 선택적 해설
 * output: client 측에서 input 문제를 생성할 수 있기 때문에 별도 output 은 필요 없음 context 절약
 */
export const generateOxTool: Tool = createTool({
  name: GEN_BLOCK_TOOL_NAMES.OX,
  description: "OX 문제를 생성합니다.",
  inputSchema: GenerateOxInputSchema,
  execute: async () => {
    await wait(TOOL_DELAY);
    const id = generateUUID();
    return {
      id,
    };
  },
});

export const loadGenerateBlockTools = (blockTypes?: BlockType[]) => {
  const allowedBlockTypes = blockTypes?.length
    ? blockTypes.filter((type) => Boolean(All_BLOCKS[type]))
    : Object.keys(All_BLOCKS);

  return allowedBlockTypes.reduce(
    (prev, type) => {
      switch (type as BlockType) {
        case "mcq":
          prev[GEN_BLOCK_TOOL_NAMES.MCQ] = generateMcqTool;
          break;
        case "mcq-multiple":
          prev[GEN_BLOCK_TOOL_NAMES.MCQ_MULTIPLE] = generateMcqMultipleTool;
          break;
        case "ranking":
          prev[GEN_BLOCK_TOOL_NAMES.RANKING] = generateRankingTool;
          break;
        case "ox":
          prev[GEN_BLOCK_TOOL_NAMES.OX] = generateOxTool;
          break;
        case "default":
          prev[GEN_BLOCK_TOOL_NAMES.SUBJECTIVE] = generateSubjectiveTool;
          break;
      }

      return prev;
    },
    {} as Record<string, Tool>,
  );
};
