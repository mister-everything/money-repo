import type {
  LanguageModelV2Middleware,
  LanguageModelV2StreamPart,
} from "@ai-sdk/provider";

import { aiPriceService, creditService } from "@service/solves";

import { simulateReadableStream } from "ai";
import { logger } from "@/lib/logger";
import {
  getWallet,
  getWalletThrowIfNotEnoughBalance,
} from "../auth/get-balance";
import { getSession } from "../auth/server";
import { generateSimulateStreamPart } from "./generate-simulate-stream-part";
import { getTokens } from "./shared";

export const vercelGatewayLanguageModelCreditMiddleware: LanguageModelV2Middleware =
  {
    wrapGenerate: async ({ doGenerate, model }) => {
      const session = await getSession();
      const wallet = await getWalletThrowIfNotEnoughBalance(session.user.id);
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
      const session = await getSession();
      const wallet = await getWallet(session.user.id);
      if (Number(wallet.balance || 0) <= 0) {
        const stream = simulateReadableStream<LanguageModelV2StreamPart>({
          chunks: generateSimulateStreamPart(
            `크레딧이 부족합니다. 제가 더이상 대화를 할 수 없어요.\n\n먼저 **크레딧을 충전하고** , 다시 우리 대화를 이어 가볼까요?😘\n\n제가 크레딧을 **충전하는 방법**을 아래 작성 해드릴게요!`,
          ),
          initialDelayInMs: 1000,
          chunkDelayInMs: 30,
        });
        return {
          stream,
        };
      }

      const [provider, modelName] = model.modelId.split("/");

      const price = await aiPriceService.getActivePriceByProviderAndModelName(
        provider,
        modelName,
      );
      if (!price) {
        logger.warn(
          `Price not found for provider: ${provider} and model: ${modelName}`,
        );
        const stream = simulateReadableStream<LanguageModelV2StreamPart>({
          chunks: generateSimulateStreamPart(
            `지금 사용하신 \`${provider}\`의 \`${modelName}\` 모델은 사용 불가능합니다.\n
            다른 모델을 선택하고, 다시 한번 말씀해주세요. 🤣`,
          ),
          initialDelayInMs: 1000,
          chunkDelayInMs: 30,
        });
        return {
          stream,
        };
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
