/**
 * AI Provider Prices Seed Data
 *
 * 실제 AI 제공자들의 가격 정보 (2024년 10월 기준)
 * 출처: 각 AI 제공자의 공식 가격 페이지
 */

import { count } from "drizzle-orm";
import inquirer from "inquirer";
import { pgDb } from "../db";
import { AiProviderPricesTable } from "./schema";

/**
 * Payment 모듈 시드 데이터 생성
 * AI 제공자 가격 정보 생성
 */
export const seedPrices = async () => {
  console.log("🌱 Seeding AI Provider Prices...");

  // 기존 가격 데이터 확인
  const hasPrices = await pgDb
    .select({ count: count() })
    .from(AiProviderPricesTable)
    .then((res) => res[0].count);

  if (hasPrices > 0) {
    const answer = await inquirer.prompt([
      {
        type: "select",
        name: "answer",
        message: `가격 데이터가 이미 ${hasPrices}개 있습니다. 추가로 생성하시겠습니까?`,
        choices: ["생성", "건너뛰기"],
      },
    ]);
    if (answer.answer === "건너뛰기") {
      console.log("⏭️  가격 시드 생성 건너뛰기\n");
      return;
    }
  }

  const prices = [
    // OpenAI
    {
      provider: "openai",
      model: "gpt-4o",
      modelType: "text",
      inputTokenPrice: "3250.00", // 3250원 per 1M tokens
      outputTokenPrice: "13000.00", // 13000원 per 1M tokens
      cachedTokenPrice: "1625.00", // 1625원 per 1M tokens (50% discount)
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "openai",
      model: "gpt-4o-mini",
      modelType: "text",
      inputTokenPrice: "195.00", // 195원 per 1M tokens
      outputTokenPrice: "780.00", // 780원 per 1M tokens
      cachedTokenPrice: "97.50", // 97.5원 per 1M tokens (50% discount)
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "openai",
      model: "gpt-4-turbo",
      modelType: "text",
      inputTokenPrice: "13000.00", // 13000원 per 1M tokens
      outputTokenPrice: "39000.00", // 39000원 per 1M tokens
      cachedTokenPrice: "6500.00", // 6500원 per 1M tokens (50% discount)
      markupRate: "1.60",
      isActive: true,
    },

    // Anthropic Claude
    {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      modelType: "text",
      inputTokenPrice: "3900.00", // 3900원 per 1M tokens
      outputTokenPrice: "19500.00", // 19500원 per 1M tokens
      cachedTokenPrice: "390.00", // 390원 per 1M tokens (90% discount)
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "anthropic",
      model: "claude-3-5-haiku-20241022",
      modelType: "text",
      inputTokenPrice: "1300.00", // 1300원 per 1M tokens
      outputTokenPrice: "6500.00", // 6500원 per 1M tokens
      cachedTokenPrice: "130.00", // 130원 per 1M tokens (90% discount)
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "anthropic",
      model: "claude-3-opus-20240229",
      modelType: "text",
      inputTokenPrice: "19500.00", // 19500원 per 1M tokens
      outputTokenPrice: "97500.00", // 97500원 per 1M tokens
      cachedTokenPrice: "1950.00", // 1950원 per 1M tokens (90% discount)
      markupRate: "1.60",
      isActive: true,
    },

    // Google Gemini
    {
      provider: "google",
      model: "gemini-1.5-pro",
      modelType: "text",
      inputTokenPrice: "1625.00", // 1625원 per 1M tokens
      outputTokenPrice: "6500.00", // 6500원 per 1M tokens
      cachedTokenPrice: "812.50", // 812.5원 per 1M tokens (50% discount)
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "google",
      model: "gemini-1.5-flash",
      modelType: "text",
      inputTokenPrice: "97.50", // 97.5원 per 1M tokens
      outputTokenPrice: "390.00", // 390원 per 1M tokens
      cachedTokenPrice: "48.75", // 48.75원 per 1M tokens (50% discount)
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "google",
      model: "gemini-2.0-flash-exp",
      modelType: "text",
      inputTokenPrice: "0.00", // 무료 프리뷰
      outputTokenPrice: "0.00",
      cachedTokenPrice: "0.00",
      markupRate: "1.60",
      isActive: true,
    },

    // xAI Grok
    {
      provider: "xai",
      model: "grok-beta",
      modelType: "text",
      inputTokenPrice: "6500.00", // 6500원 per 1M tokens
      outputTokenPrice: "19500.00", // 19500원 per 1M tokens
      cachedTokenPrice: "3250.00", // 3250원 per 1M tokens (50% discount)
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
        `  ${price.provider}/${price.model}: ${price.inputTokenPrice}원/1M in, ${price.outputTokenPrice}원/1M out (${Number(price.markupRate) * 100 - 100}% markup)`,
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
