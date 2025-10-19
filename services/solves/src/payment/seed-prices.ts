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
      inputTokenPrice: "0.00250000", // $2.50 per 1M tokens
      outputTokenPrice: "0.01000000", // $10.00 per 1M tokens
      cachedTokenPrice: "0.00125000", // $1.25 per 1M tokens (50% discount)
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "openai",
      model: "gpt-4o-mini",
      modelType: "text",
      inputTokenPrice: "0.00015000", // $0.15 per 1M tokens
      outputTokenPrice: "0.00060000", // $0.60 per 1M tokens
      cachedTokenPrice: "0.00007500", // $0.075 per 1M tokens (50% discount)
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "openai",
      model: "gpt-4-turbo",
      modelType: "text",
      inputTokenPrice: "0.01000000", // $10.00 per 1M tokens
      outputTokenPrice: "0.03000000", // $30.00 per 1M tokens
      cachedTokenPrice: "0.00500000", // $5.00 per 1M tokens (50% discount)
      markupRate: "1.60",
      isActive: true,
    },

    // Anthropic Claude
    {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      modelType: "text",
      inputTokenPrice: "0.00300000", // $3.00 per 1M tokens
      outputTokenPrice: "0.01500000", // $15.00 per 1M tokens
      cachedTokenPrice: "0.00030000", // $0.30 per 1M tokens (90% discount)
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "anthropic",
      model: "claude-3-5-haiku-20241022",
      modelType: "text",
      inputTokenPrice: "0.00100000", // $1.00 per 1M tokens
      outputTokenPrice: "0.00500000", // $5.00 per 1M tokens
      cachedTokenPrice: "0.00010000", // $0.10 per 1M tokens (90% discount)
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "anthropic",
      model: "claude-3-opus-20240229",
      modelType: "text",
      inputTokenPrice: "0.01500000", // $15.00 per 1M tokens
      outputTokenPrice: "0.07500000", // $75.00 per 1M tokens
      cachedTokenPrice: "0.00150000", // $1.50 per 1M tokens (90% discount)
      markupRate: "1.60",
      isActive: true,
    },

    // Google Gemini
    {
      provider: "google",
      model: "gemini-1.5-pro",
      modelType: "text",
      inputTokenPrice: "0.00125000", // $1.25 per 1M tokens
      outputTokenPrice: "0.00500000", // $5.00 per 1M tokens
      cachedTokenPrice: "0.00062500", // $0.625 per 1M tokens (50% discount)
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "google",
      model: "gemini-1.5-flash",
      modelType: "text",
      inputTokenPrice: "0.00007500", // $0.075 per 1M tokens
      outputTokenPrice: "0.00030000", // $0.30 per 1M tokens
      cachedTokenPrice: "0.00003750", // $0.0375 per 1M tokens (50% discount)
      markupRate: "1.60",
      isActive: true,
    },
    {
      provider: "google",
      model: "gemini-2.0-flash-exp",
      modelType: "text",
      inputTokenPrice: "0.00000000", // Free during preview
      outputTokenPrice: "0.00000000",
      cachedTokenPrice: "0.00000000",
      markupRate: "1.60",
      isActive: true,
    },

    // xAI Grok
    {
      provider: "xai",
      model: "grok-beta",
      modelType: "text",
      inputTokenPrice: "0.00500000", // $5.00 per 1M tokens
      outputTokenPrice: "0.01500000", // $15.00 per 1M tokens
      cachedTokenPrice: "0.00250000", // $2.50 per 1M tokens (50% discount)
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
        `  ${price.provider}/${price.model}: $${price.inputTokenPrice}/1M in, $${price.outputTokenPrice}/1M out (${Number(price.markupRate) * 100 - 100}% markup)`,
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
