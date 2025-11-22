import type {
  LanguageModelV2Middleware,
  LanguageModelV2StreamPart,
  LanguageModelV2Usage,
} from "@ai-sdk/provider";

import { aiPriceService, creditService } from "@service/solves";
import { isNull } from "@workspace/util";
import { getWalletThrowIfNotEnoughBalance } from "../auth/get-balance";

function getTokens(useage: LanguageModelV2Usage) {
  if (isNull(useage.inputTokens)) {
    // @TODO  중요 에러 일 수 있기 때문에 Notice  되도록
    console.warn(`inputTokens is null for useage: ${JSON.stringify(useage)}`);
  }

  if (isNull(useage.outputTokens)) {
    // @TODO  중요 에러 일 수 있기 때문에 Notice  되도록
    console.warn(`outputTokens is null for useage: ${JSON.stringify(useage)}`);
  }

  return {
    inputTokens: (useage.inputTokens || 0) + (useage.reasoningTokens || 0),
    outputTokens: useage.outputTokens || 0,
  };
}

export const vercelGatewayLanguageModelCreditMiddleware: LanguageModelV2Middleware =
  {
    wrapGenerate: async ({ doGenerate, model }) => {
      const wallet = await getWalletThrowIfNotEnoughBalance();
      const [provider, modelName] = model.modelId.split("/");
      const price = await aiPriceService.getActivePriceByProviderAndModelName(
        provider,
        modelName,
      );
      if (!price) {
        throw new Error(
          `Price not found for provider: ${provider} and model: ${modelName}`,
        );
      }
      const result = await doGenerate();
      const { inputTokens, outputTokens } = getTokens(result.usage);
      const vendorCost =
        result.providerMetadata?.gateway?.marketCost ||
        result.providerMetadata?.gateway?.cost;
      creditService.consumeAICredit({
        inputTokens,
        outputTokens,
        price,
        userId: wallet.userId,
        walletId: wallet.id,
        vendorCost: vendorCost ? Number(vendorCost) : undefined,
      });
      return result;
    },

    wrapStream: async ({ doStream, model }) => {
      const wallet = await getWalletThrowIfNotEnoughBalance();

      const [provider, modelName] = model.modelId.split("/");

      const price = await aiPriceService.getActivePriceByProviderAndModelName(
        provider,
        modelName,
      );
      if (!price) {
        throw new Error(
          `Price not found for provider: ${provider} and model: ${modelName}`,
        );
      }

      const { stream, ...rest } = await doStream();

      const transformStream = new TransformStream<
        LanguageModelV2StreamPart,
        LanguageModelV2StreamPart
      >({
        transform(chunk, controller) {
          switch (chunk.type) {
            case "finish": {
              const vendorCost =
                chunk.providerMetadata?.gateway?.marketCost ||
                chunk.providerMetadata?.gateway?.cost;
              const { inputTokens, outputTokens } = getTokens(chunk.usage);
              creditService.consumeAICredit({
                inputTokens,
                outputTokens,
                price,
                userId: wallet.userId,
                vendorCost: vendorCost ? Number(vendorCost) : undefined,
                walletId: wallet.id,
              });
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
