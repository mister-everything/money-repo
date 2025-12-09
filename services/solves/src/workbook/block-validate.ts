import z, { ZodError } from "zod";
import { logger } from "../logger";
import { WorkBookBlock } from "./types";
import { parseAnswer, parseContent } from "./utils";

export const blockValidate = (
  block: Pick<WorkBookBlock, "question" | "content" | "answer" | "type">,
):
  | { success: true }
  | {
      success: false;
      message: string;
      errors?: Record<string, string[]>;
    } => {
  try {
    if (block.type !== block.content?.type)
      return {
        success: false,
        message: `블럭 타입과 콘텐츠 타입이 일치하지 않습니다.`,
      };
    if (block.type !== block.answer?.type)
      return {
        success: false,
        message: `블럭 타입과 정답 타입이 일치하지 않습니다.`,
      };

    let result: ReturnType<typeof blockValidate> = {
      success: true,
    };

    const questionResult = z
      .object({
        question: z
          .string("질문은 필수 입력값입니다.")
          .min(1, "질문은 최소 1자 이상 입력해주세요.")
          .max(500, "최대 500자 이하로 입력해주세요."),
      })
      .safeParse({
        question: block.question,
      });

    if (!questionResult.success) {
      return {
        success: false,
        message: `질문 검증에 실패했습니다.`,
        errors:
          z.flattenError(questionResult.error as ZodError).fieldErrors || {},
      };
    }
    const contentResult = parseContent(block.content);
    if (!contentResult.success) {
      return {
        success: false,
        message: `콘텐츠 검증에 실패했습니다.`,
        errors:
          z.flattenError(contentResult.error as ZodError).fieldErrors || {},
      };
    }
    const answerResult = parseAnswer(block.answer);
    if (!answerResult.success) {
      return {
        success: false,
        message: `정답 검증에 실패했습니다.`,
        errors:
          z.flattenError(answerResult.error as ZodError).fieldErrors || {},
      };
    }

    return result;
  } catch (error) {
    logger.error(error);
    return {
      success: false,
      message: `블럭 검증에 실패했습니다.`,
    };
  }
};
