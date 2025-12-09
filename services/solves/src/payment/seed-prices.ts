/**
 * AI Provider Prices Seed Data
 *
 * 실제 AI 제공자들의 가격 정보 (2024년 10월 기준)
 * 출처: 각 AI 제공자의 공식 가격 페이지
 */

import { pgDb } from "../db";
import { logger } from "../logger";
import { AiProviderPricesTable } from "./schema";

/**
 * Payment 모듈 시드 데이터 생성
 * AI 제공자 가격 정보 생성
 */
export const seedPrices = async () => {
  logger.info("🌱 Seeding AI Provider Prices...");

  const prices: (typeof AiProviderPricesTable.$inferInsert)[] = [
    {
      provider: "openai",
      model: "gpt-4o-mini",
      displayName: "기본모델",
      modelType: "text",
      inputTokenPrice: "0.00000015",
      outputTokenPrice: "0.00000060",
      cachedTokenPrice: "0.00000008",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "openai",
      model: "gpt-5.1-instant",
      displayName: "GPT-5.1",
      modelType: "text",
      inputTokenPrice: "0.00000020",
      outputTokenPrice: "0.00000160",
      cachedTokenPrice: "0.00000003",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "openai",
      model: "gpt-5.1-thinking",
      displayName: "GPT 5.1 Thinking",
      modelType: "text",
      inputTokenPrice: "0.00000100",
      outputTokenPrice: "0.00000800",
      cachedTokenPrice: "0.00000010",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "anthropic",
      model: "claude-haiku-4.5",
      displayName: "Claude Haiku 4.5",
      modelType: "text",
      inputTokenPrice: "0.00000100",
      outputTokenPrice: "0.00000500",
      cachedTokenPrice: "0.00000010",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "google",
      model: "gemini-3-pro-preview",
      displayName: "Gemini 3 Pro Preview",
      modelType: "text",
      inputTokenPrice: "0.00000150",
      outputTokenPrice: "0.00001200",
      cachedTokenPrice: "0.00000015",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "xai",
      model: "grok-4.1-fast-reasoning",
      displayName: "Grok 4.1",
      modelType: "text",
      inputTokenPrice: "0.00000025",
      outputTokenPrice: "0.00000060",
      cachedTokenPrice: "0.00000006",
      markupRate: "1.60",
      isActive: true,
    },
  ];

  const inserted = await pgDb
    .insert(AiProviderPricesTable)
    .values(prices)
    .onConflictDoNothing()
    .returning();

  logger.info(`✅ Seeded ${inserted.length} AI provider prices`);

  // Print summary
  if (inserted.length > 0) {
    logger.info("\n📊 Price Summary:");
    for (const price of inserted) {
      logger.info(
        `  ${price.displayName} (${price.provider}/${price.model}): $${price.inputTokenPrice}/token in, $${price.outputTokenPrice}/token out (${Number(price.markupRate) * 100 - 100}% markup)`,
      );
    }
  }

  logger.info("✅ Payment 시드 데이터 생성 완료\n");
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import("@workspace/env");
  seedPrices()
    .then(() => {
      logger.info("\n✅ Seed completed!");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("❌ Seed failed:", error);
      process.exit(1);
    });
}
