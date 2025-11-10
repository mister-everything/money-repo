import type {
  LanguageModelV2Middleware,
  LanguageModelV2StreamPart,
} from "@ai-sdk/provider";
import { aiPriceService } from "@service/solves";
import { checkHasEnoughBalance } from "../auth/get-balance";

export const vercelGatewayLanguageModelCreditMiddleware: LanguageModelV2Middleware =
  {
    wrapGenerate: async ({ doGenerate, model }) => {
      await checkHasEnoughBalance();
      const [provider, modelName] = model.modelId.split("/");
      const price = await aiPriceService.getPriceByProviderAndModelName(
        provider,
        modelName,
      );
      if (price === null) {
        throw new Error(
          `Price not found for provider: ${provider} and model: ${modelName}`,
        );
      }
      const result = await doGenerate();
      console.dir(
        {
          ok: result.providerMetadata,
          provider,
          modelName,
        },
        {
          depth: null,
        },
      );

      return result;
    },

    wrapStream: async ({ doStream, model }) => {
      await checkHasEnoughBalance();

      const [provider, modelName] = model.modelId.split("/");
      console.dir(
        {
          provider,
          modelName,
        },
        {
          depth: null,
        },
      );

      const { stream, ...rest } = await doStream();

      const transformStream = new TransformStream<
        LanguageModelV2StreamPart,
        LanguageModelV2StreamPart
      >({
        transform(chunk, controller) {
          switch (chunk.type) {
            case "finish": {
              console.dir(
                {
                  ok: chunk.providerMetadata,
                  provider,
                  modelName,
                  x: chunk.usage,
                },
                {
                  depth: null,
                },
              );
            }
          }

          controller.enqueue(chunk);
        },
      });

      return {
        stream: stream.pipeThrough(transformStream),
        ...rest,
      };
    },
  };
