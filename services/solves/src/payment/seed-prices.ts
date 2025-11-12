/**
 * AI Provider Prices Seed Data
 *
 * 실제 AI 제공자들의 가격 정보 (2024년 10월 기준)
 * 출처: 각 AI 제공자의 공식 가격 페이지
 */

import { pgDb } from "../db";
import { AiProviderPricesTable } from "./schema";

/**
 * Payment 모듈 시드 데이터 생성
 * AI 제공자 가격 정보 생성
 */
export const seedPrices = async () => {
  console.log("🌱 Seeding AI Provider Prices...");

  const prices: (typeof AiProviderPricesTable.$inferInsert)[] = [
    // OpenAI Models
    {
      provider: "openai",
      model: "gpt-4o",
      displayName: "GPT-4o",
      modelType: "text",
      inputTokenPrice: "0.00000250",
      outputTokenPrice: "0.00001000",
      cachedTokenPrice: "0.00000125",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "openai",
      model: "gpt-4o-mini",
      displayName: "GPT-4o mini",
      modelType: "text",
      inputTokenPrice: "0.00000015",
      outputTokenPrice: "0.00000060",
      cachedTokenPrice: "0.00000008",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "openai",
      model: "gpt-4-turbo",
      displayName: "GPT-4 Turbo",
      modelType: "text",
      inputTokenPrice: "0.00001000",
      outputTokenPrice: "0.00003000",
      cachedTokenPrice: "0.00000500",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "openai",
      model: "gpt-4.1",
      displayName: "GPT-4.1",
      modelType: "text",
      inputTokenPrice: "0.00000200",
      outputTokenPrice: "0.00000800",
      cachedTokenPrice: "0.00000050",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "openai",
      model: "gpt-4.1-mini",
      displayName: "GPT-4.1 mini",
      modelType: "text",
      inputTokenPrice: "0.00000040",
      outputTokenPrice: "0.00000160",
      cachedTokenPrice: "0.00000010",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "openai",
      model: "gpt-5",
      displayName: "GPT-5",
      modelType: "text",
      inputTokenPrice: "0.00000125",
      outputTokenPrice: "0.00001000",
      cachedTokenPrice: "0.00000013",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "openai",
      model: "gpt-5-mini",
      displayName: "GPT-5 mini",
      modelType: "text",
      inputTokenPrice: "0.00000025",
      outputTokenPrice: "0.00000200",
      cachedTokenPrice: "0.00000003",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "openai",
      model: "o1",
      displayName: "o1",
      modelType: "text",
      inputTokenPrice: "0.00001500",
      outputTokenPrice: "0.00006000",
      cachedTokenPrice: "0.00000750",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "openai",
      model: "o3",
      displayName: "o3",
      modelType: "text",
      inputTokenPrice: "0.00000200",
      outputTokenPrice: "0.00000800",
      cachedTokenPrice: "0.00000050",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "openai",
      model: "o3-mini",
      displayName: "o3-mini",
      modelType: "text",
      inputTokenPrice: "0.00000110",
      outputTokenPrice: "0.00000440",
      cachedTokenPrice: "0.00000055",
      markupRate: "1.60",
      isActive: true,
    },

    // Anthropic Claude Models
    {
      provider: "anthropic",
      model: "claude-3.5-sonnet",
      displayName: "Claude 3.5 Sonnet",
      modelType: "text",
      inputTokenPrice: "0.00000300",
      outputTokenPrice: "0.00001500",
      cachedTokenPrice: "0.00000030",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "anthropic",
      model: "claude-3.7-sonnet",
      displayName: "Claude 3.7 Sonnet",
      modelType: "text",
      inputTokenPrice: "0.00000300",
      outputTokenPrice: "0.00001500",
      cachedTokenPrice: "0.00000030",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "anthropic",
      model: "claude-sonnet-4",
      displayName: "Claude Sonnet 4",
      modelType: "text",
      inputTokenPrice: "0.00000300",
      outputTokenPrice: "0.00001500",
      cachedTokenPrice: "0.00000030",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "anthropic",
      model: "claude-3.5-haiku",
      displayName: "Claude 3.5 Haiku",
      modelType: "text",
      inputTokenPrice: "0.00000080",
      outputTokenPrice: "0.00000400",
      cachedTokenPrice: "0.00000008",
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
      provider: "anthropic",
      model: "claude-opus-4",
      displayName: "Claude Opus 4",
      modelType: "text",
      inputTokenPrice: "0.00001500",
      outputTokenPrice: "0.00007500",
      cachedTokenPrice: "0.00000150",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "anthropic",
      model: "claude-3-opus",
      displayName: "Claude 3 Opus",
      modelType: "text",
      inputTokenPrice: "0.00001500",
      outputTokenPrice: "0.00007500",
      cachedTokenPrice: "0.00000150",
      markupRate: "1.60",
      isActive: true,
    },

    // Google Gemini Models
    {
      provider: "google",
      model: "gemini-2.0-flash",
      displayName: "Gemini 2.0 Flash",
      modelType: "text",
      inputTokenPrice: "0.00000010",
      outputTokenPrice: "0.00000040",
      cachedTokenPrice: "0.00000003",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "google",
      model: "gemini-2.5-flash",
      displayName: "Gemini 2.5 Flash",
      modelType: "text",
      inputTokenPrice: "0.00000030",
      outputTokenPrice: "0.00000250",
      cachedTokenPrice: "0.00000003",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "google",
      model: "gemini-2.5-flash-lite",
      displayName: "Gemini 2.5 Flash Lite",
      modelType: "text",
      inputTokenPrice: "0.00000010",
      outputTokenPrice: "0.00000040",
      cachedTokenPrice: "0.00000001",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "google",
      model: "gemini-2.5-pro",
      displayName: "Gemini 2.5 Pro",
      modelType: "text",
      inputTokenPrice: "0.00000125",
      outputTokenPrice: "0.00001000",
      cachedTokenPrice: "0.00000013",
      markupRate: "1.60",
      isActive: true,
    },

    // xAI Grok Models
    {
      provider: "xai",
      model: "grok-2",
      displayName: "Grok 2",
      modelType: "text",
      inputTokenPrice: "0.00000200",
      outputTokenPrice: "0.00001000",
      cachedTokenPrice: "0.00000100",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "xai",
      model: "grok-3",
      displayName: "Grok 3 Beta",
      modelType: "text",
      inputTokenPrice: "0.00000300",
      outputTokenPrice: "0.00001500",
      cachedTokenPrice: "0.00000150",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "xai",
      model: "grok-4",
      displayName: "Grok 4",
      modelType: "text",
      inputTokenPrice: "0.00000300",
      outputTokenPrice: "0.00001500",
      cachedTokenPrice: "0.00000150",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "xai",
      model: "grok-4-fast-non-reasoning",
      displayName: "Grok 4 Fast Non-Reasoning",
      modelType: "text",
      inputTokenPrice: "0.00000020",
      outputTokenPrice: "0.00000050",
      cachedTokenPrice: "0.00000005",
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "xai",
      model: "grok-4-fast-reasoning",
      displayName: "Grok 4 Fast Reasoning",
      modelType: "text",
      inputTokenPrice: "0.00000020",
      outputTokenPrice: "0.00000050",
      cachedTokenPrice: "0.00000005",
      markupRate: "1.60",
      isActive: true,
    },
  ];

  const inserted = await pgDb
    .insert(AiProviderPricesTable)
    .values(prices)
    .onConflictDoNothing()
    .returning();

  console.log(`✅ Seeded ${inserted.length} AI provider prices`);

  // Print summary
  if (inserted.length > 0) {
    console.log("\n📊 Price Summary:");
    for (const price of inserted) {
      console.log(
        `  ${price.displayName} (${price.provider}/${price.model}): $${price.inputTokenPrice}/token in, $${price.outputTokenPrice}/token out (${Number(price.markupRate) * 100 - 100}% markup)`,
      );
    }
  }

  console.log("✅ Payment 시드 데이터 생성 완료\n");
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import("@workspace/env");
  seedPrices()
    .then(() => {
      console.log("\n✅ Seed completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    });
}
