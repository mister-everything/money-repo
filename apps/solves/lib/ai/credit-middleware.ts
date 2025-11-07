import type {
  LanguageModelV2Middleware,
  LanguageModelV2StreamPart,
} from "@ai-sdk/provider";
import { checkHasEnoughBalance } from "../auth/get-balance";

export const creditMiddleware: LanguageModelV2Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    await checkHasEnoughBalance();

    const result = await doGenerate();
    return result;
  },

  wrapStream: async ({ doStream }) => {
    await checkHasEnoughBalance();
    const { stream, ...rest } = await doStream();

    const transformStream = new TransformStream<
      LanguageModelV2StreamPart,
      LanguageModelV2StreamPart
    >({
      flush() {
        console.log("doStream finished");
      },
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    };
  },
};
