import { PublicError } from "@workspace/error";
import { and, eq, getTableColumns } from "drizzle-orm";
import { CacheKeys, CacheTTL } from "../cache-keys";
import { pgDb } from "../db";
import { sharedCache } from "../shared-cache";
import { AiProviderPricesTable } from "./schema";
import {
  AIPrice,
  type CreateAIPrice,
  createAIPriceSchema,
  type UpdateAIPrice,
  updateAIPriceSchema,
} from "./types";

/**
 * AI Price Service
 *
 * AI Provider Prices 관리 서비스
 */
export const aiPriceService = {
  getActivePrices: async (): Promise<AIPrice[]> => {
    const prices = await pgDb
      .select(getTableColumns(AiProviderPricesTable))
      .from(AiProviderPricesTable)
      .where(eq(AiProviderPricesTable.isActive, true));
    return prices;
  },

  /**
   * Provider와 Model로 가격 조회 (Cache 우선 → DB Fallback)
   * @param provider - AI 제공자 (openai, gemini, claude, xai)
   * @param model - 모델명 (gpt-4o-mini, claude-3-5-sonnet, etc.)
   * @returns AI 가격 정보
   */
  getActivePriceByProviderAndModelName: async (
    provider: string,
    model: string,
  ): Promise<AIPrice | null> => {
    // 1) 캐시에서 먼저 확인
    const cacheKey = CacheKeys.aiPrice(provider, model);
    const cached = await sharedCache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as AIPrice;
    }

    // 2) 캐시 미스 → DB 조회
    const [price] = await pgDb
      .select()
      .from(AiProviderPricesTable)
      .where(
        and(
          eq(AiProviderPricesTable.provider, provider),
          eq(AiProviderPricesTable.model, model),
          eq(AiProviderPricesTable.isActive, true),
        ),
      );

    // 3) DB에서 찾은 경우 캐시에 저장 (1시간)
    if (price) {
      await sharedCache.setex(
        cacheKey,
        CacheTTL.AI_PRICE,
        JSON.stringify(price),
      );
    }

    return price;
  },

  /**
   * 모든 AI 가격 조회
   */
  getAllPrices: async (): Promise<AIPrice[]> => {
    const prices = await pgDb
      .select(getTableColumns(AiProviderPricesTable))
      .from(AiProviderPricesTable)
      .orderBy(AiProviderPricesTable.provider, AiProviderPricesTable.model);

    return prices;
  },

  /**
   * ID로 단일 가격 조회
   */
  getPriceById: async (priceId: string) => {
    const [price] = await pgDb
      .select(getTableColumns(AiProviderPricesTable))
      .from(AiProviderPricesTable)
      .where(eq(AiProviderPricesTable.id, priceId));

    return price ?? null;
  },

  /**
   * 가격 생성 (생성 후 캐시에 저장)
   */
  createPrice: async (data: CreateAIPrice) => {
    const [price] = await pgDb
      .insert(AiProviderPricesTable)
      .values(createAIPriceSchema.parse(data))
      .returning();

    // 캐시에 저장 (isActive가 true인 경우만)
    if (price && price.isActive) {
      const cacheKey = CacheKeys.aiPrice(price.provider, price.model);
      await sharedCache.setex(
        cacheKey,
        CacheTTL.AI_PRICE,
        JSON.stringify(price),
      );
    }

    return price;
  },

  /**
   * 가격 업데이트 (업데이트 후 캐시 갱신)
   */
  updatePrice: async (priceId: string, data: Partial<UpdateAIPrice>) => {
    const [price] = await pgDb
      .update(AiProviderPricesTable)
      .set({
        ...updateAIPriceSchema.parse(data),
        updatedAt: new Date(),
      })
      .where(eq(AiProviderPricesTable.id, priceId))
      .returning();

    if (!price) {
      throw new PublicError(`가격 정보를 찾을 수 없습니다: ${priceId}`);
    }

    // 캐시 갱신 (isActive가 true인 경우 저장, false인 경우 삭제)
    const cacheKey = CacheKeys.aiPrice(price.provider, price.model);
    if (price.isActive) {
      await sharedCache.setex(
        cacheKey,
        CacheTTL.AI_PRICE,
        JSON.stringify(price),
      );
    } else {
      await sharedCache.del(cacheKey);
    }

    return price;
  },

  /**
   * 가격 활성화/비활성화 (캐시 갱신)
   */
  setPriceActive: async (priceId: string, isActive: boolean) => {
    const [price] = await pgDb
      .update(AiProviderPricesTable)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(AiProviderPricesTable.id, priceId))
      .returning();

    if (!price) {
      throw new PublicError(`가격 정보를 찾을 수 없습니다: ${priceId}`);
    }

    // 캐시 갱신 (활성화 시 저장, 비활성화 시 삭제)
    const cacheKey = CacheKeys.aiPrice(price.provider, price.model);
    if (isActive) {
      await sharedCache.setex(
        cacheKey,
        CacheTTL.AI_PRICE,
        JSON.stringify(price),
      );
    } else {
      await sharedCache.del(cacheKey);
    }

    return price;
  },
};
