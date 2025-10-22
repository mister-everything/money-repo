import { eq, getTableColumns } from "drizzle-orm";
import { pgDb } from "../db";
import { AiProviderPricesTable } from "./schema";
import {
  type CreateAIPrice,
  createAIPriceSchema,
  type UpdateAIPrice,
  updateAIPriceSchema,
} from "./types";

/**
 * AI Price Admin Service
 *
 * AI Provider Prices 관리 서비스
 */
export const aiPriceAdminService = {
  /**
   * 모든 AI 가격 조회
   */
  getAllPrices: async () => {
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
   * 가격 생성
   */
  createPrice: async (data: CreateAIPrice) => {
    const [price] = await pgDb
      .insert(AiProviderPricesTable)
      .values(createAIPriceSchema.parse(data))
      .returning();

    return price;
  },

  /**
   * 가격 업데이트
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
      throw new Error(`가격 정보를 찾을 수 없습니다: ${priceId}`);
    }

    return price;
  },

  /**
   * 가격 활성화/비활성화
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
      throw new Error(`가격 정보를 찾을 수 없습니다: ${priceId}`);
    }

    return price;
  },

  /**
   * 가격 삭제 (soft delete)
   */
  deletePrice: async (priceId: string) => {
    const [price] = await pgDb
      .update(AiProviderPricesTable)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(AiProviderPricesTable.id, priceId))
      .returning();

    if (!price) {
      throw new Error(`가격 정보를 찾을 수 없습니다: ${priceId}`);
    }

    return price;
  },
};
