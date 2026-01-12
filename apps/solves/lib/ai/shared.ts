import { LanguageModelV2Usage } from "@ai-sdk/provider";
import { isNull } from "@workspace/util";
import { logger } from "../logger";

export function getTokens(useage: LanguageModelV2Usage) {
  if (isNull(useage.inputTokens)) {
    // @TODO  중요 에러 일 수 있기 때문에 Notice  되도록
    logger.warn(`inputTokens is null for useage: ${JSON.stringify(useage)}`);
  }

  if (isNull(useage.outputTokens)) {
    // @TODO  중요 에러 일 수 있기 때문에 Notice  되도록
    logger.warn(`outputTokens is null for useage: ${JSON.stringify(useage)}`);
  }

  return {
    inputTokens: (useage.inputTokens || 0) + (useage.reasoningTokens || 0),
    outputTokens: useage.outputTokens || 0,
  };
}

export const ToolApprovedMessage = "해당 도구 결과를 적용했습니다.";
export const ToolCanceledMessage =
  "사용자가 도구 사용을 cancel 하였습니다. 이유를 물어보고 적절한 조치를 취하세요.";
