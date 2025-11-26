import { errorToString } from "@workspace/util";
import { IS_PROD } from "@workspace/util/const";
import z, { ZodAny, ZodType } from "zod";
import {
  fail,
  isSafeFail,
  isSafeResponse,
  ok,
  SafeFailResponse,
  SafeFunction,
  SafeResponse,
} from "./interface";
import { log } from "@/lib/logger";

type MiddlewareConfig = {
  middleware?: {
    before?: Array<(input: any) => any | Promise<any>>;
    after?: Array<
      (
        output: SafeResponse<any>,
      ) => SafeResponse<any> | Promise<SafeResponse<any>>
    >;
  };
};

export const createActionFactory = (ctx: MiddlewareConfig) => {
  function createAction<I, O>(
    schema: ZodType<I>,
    handler: (data: I) => Promise<O> | O,
  ): SafeFunction<I, O>;

  function createAction<I = any, O = any>(
    handler: (data: I) => Promise<O> | O,
  ): SafeFunction<I, O>;

  function createAction<I, O>(
    arg1: ZodType<I> | ((data: I) => Promise<O> | O),
    arg2?: (data: any) => Promise<O> | O,
  ): SafeFunction<I, O> {
    const hasSchema = typeof arg2 === "function";
    const schema = (hasSchema ? arg1 : undefined) as ZodAny | undefined;
    const handler = (hasSchema ? arg2 : arg1) as (data: I) => Promise<O> | O;

    const wrapped: SafeFunction<I, O> = async (
      rawInput: I,
    ): Promise<SafeResponse<O>> => {
      let input = rawInput as any;

      try {
        // 1) before 미들웨어 먼저 실행 (인증, 전처리, 로깅 등)
        if (ctx.middleware?.before?.length) {
          for (const mw of ctx.middleware.before) {
            input = await mw(input);
          }
        }

        // 2) 스키마 검증 (before 미들웨어가 전처리한 데이터 검증)
        if (schema) {
          const parsed = schema.safeParse(input);
          if (!parsed.success) {
            const fields = z.flattenError(parsed.error).fieldErrors;
            throw fail("입력값을 확인해주세요.", fields);
          }
          input = parsed.data;
        }

        const result = await handler(input);

        let safe: SafeResponse<O>;
        if (isSafeResponse<O>(result)) {
          safe = result;
        } else {
          safe = ok(result as O);
        }

        if (ctx.middleware?.after?.length) {
          for (const mw of ctx.middleware.after) {
            safe = await mw(safe);
          }
        }

        return safe;
      } catch (error: any) {
        if (error?.message === "NEXT_REDIRECT") {
          throw error;
        }
        let base: SafeFailResponse = isSafeFail(error)
          ? error
          : fail(errorToString(error), undefined, error);

        if (ctx.middleware?.after?.length) {
          for (const mw of ctx.middleware.after) {
            base = (await mw(base)) as SafeFailResponse;
          }
        }

        return base;
      }
    };

    return wrapped;
  }

  return createAction;
};

const devLogger = (name: string) => (input: any) => {
  if (isSafeFail(input)) {
    log.info(`❌ [SERVER ACTION] ${name}: ${input.message}`);
    log.error(input.error);
  } else log.info(`[SERVER ACTION] ${name}: ${JSON.stringify(input)}`);
  return input;
};

export const safeAction = createActionFactory({
  middleware: {
    before: IS_PROD ? [] : [devLogger("input")],
    after: IS_PROD ? [] : [devLogger("output")],
  },
});
