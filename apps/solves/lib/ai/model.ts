import { ChatModel } from "@service/solves/shared";

import {
  defaultSettingsMiddleware,
  gateway,
  LanguageModel,
  wrapLanguageModel,
} from "ai";
import { vercelGatewayLanguageModelCreditMiddleware } from "./credit-middleware";

const memory = new Map<string, LanguageModel>();

const convertToModelKey = (m: ChatModel) => `${m.provider}/${m.model}`;

export const getChatModel = (model: ChatModel) => {
  const key = convertToModelKey(model);
  if (memory.has(key)) {
    return memory.get(key)!;
  }
  const chatModel = wrapLanguageModel({
    model: gateway(key),
    middleware: [
      vercelGatewayLanguageModelCreditMiddleware,
      defaultSettingsMiddleware({
        settings: {
          providerOptions: {
            openai: {
              reasoningEffort: "low",
              reasoningSummary: "auto",
            },
            google: {
              thinkingConfig: {
                thinkingLevel: "low",
                includeThoughts: true,
              },
            },
          },
        },
      }),
    ],
  });
  memory.set(key, chatModel);
  return chatModel;
};
