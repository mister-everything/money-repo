"use server";
import { aiPriceService } from "@service/solves";
import {
  createAIPriceSchema,
  updateAIPriceSchema,
} from "@service/solves/shared";
import { z } from "zod";
import { safeAction } from "@/lib/protocol/server-action";

/**
 * AI 가격 생성 액션
 */
export const createAIPriceAction = safeAction(
  createAIPriceSchema,
  async (data) => {
    const created = await aiPriceService.createPrice(data);
    return created;
  },
);

/**
 * AI 가격 수정 액션
 */
export const updateAIPriceAction = safeAction(
  updateAIPriceSchema.extend({ id: z.string() }),
  async ({ id, ...data }) => {
    await aiPriceService.updatePrice(id, data);
    return { id };
  },
);

/**
 * AI 가격 활성화/비활성화 토글 액션
 */
export const toggleAIPriceActiveAction = safeAction(
  z.object({
    priceId: z.string(),
    isActive: z.boolean(),
  }),
  async ({ priceId, isActive }) => {
    await aiPriceService.setPriceActive(priceId, isActive);
    return { priceId, isActive };
  },
);

/**
 * modelType별 기본 모델 설정 액션
 */
export const setDefaultModelAction = safeAction(
  z.object({
    priceId: z.string(),
    modelType: z.string(),
  }),
  async ({ priceId, modelType }) => {
    await aiPriceService.setDefaultModel(priceId, modelType);
    return { priceId, modelType };
  },
);
