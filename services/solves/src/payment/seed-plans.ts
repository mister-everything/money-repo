/**
 * Subscription Plans Seed Data
 *
 * 구독 플랜 초기 데이터 생성
 * - Free Plan: 무료 플랜 (소량 할당량 + 정기 충전)
 * - Pro Plan: 유료 플랜 (대량 할당량 + 정기 충전)
 */

import { count } from "drizzle-orm";
import inquirer from "inquirer";
import { pgDb } from "../db";
import { SubscriptionPlansTable } from "./schema";

/**
 * 구독 플랜 시드 데이터 생성
 */
export const seedPlans = async () => {
  console.log("🌱 Seeding Subscription Plans...");

  // 기존 플랜 데이터 확인
  const hasPlans = await pgDb
    .select({ count: count() })
    .from(SubscriptionPlansTable)
    .then((res) => res[0].count);

  if (hasPlans > 0) {
    const answer = await inquirer.prompt([
      {
        type: "select",
        name: "answer",
        message: `구독 플랜이 이미 ${hasPlans}개 있습니다. 추가로 생성하시겠습니까?`,
        choices: ["생성", "건너뛰기"],
      },
    ]);
    if (answer.answer === "건너뛰기") {
      console.log("⏭️  플랜 시드 생성 건너뛰기\n");
      return;
    }
  }

  const plans = [
    {
      name: "free",
      displayName: "Free Plan",
      priceUsd: "0.000000",
      monthlyQuota: "1000.000000", // 월 1,000 크레딧
      refillAmount: "50.000000", // 6시간마다 50 크레딧 충전
      refillIntervalHours: 6,
      maxRefillBalance: "200.000000", // 최대 200까지 누적
      rolloverEnabled: false, // 미사용 크레딧 이월 안됨 (매월 리셋)
      isActive: true,
    },
    {
      name: "pro",
      displayName: "Pro Plan",
      priceUsd: "10000.000000", // 월 $100 (또는 10,000원)
      monthlyQuota: "10000.000000", // 월 10,000 크레딧
      refillAmount: "500.000000", // 6시간마다 500 크레딧 충전
      refillIntervalHours: 6,
      maxRefillBalance: "2000.000000", // 최대 2,000까지 누적
      rolloverEnabled: true, // 미사용 크레딧 이월 (누적 가능)
      isActive: true,
    },
    {
      name: "business",
      displayName: "Business Plan",
      priceUsd: "50000.000000", // 월 $500 (또는 50,000원)
      monthlyQuota: "100000.000000", // 월 100,000 크레딧
      refillAmount: "5000.000000", // 6시간마다 5,000 크레딧 충전
      refillIntervalHours: 6,
      maxRefillBalance: "20000.000000", // 최대 20,000까지 누적
      rolloverEnabled: true, // 미사용 크레딧 이월 (누적 가능)
      isActive: true,
    },
  ];

  const inserted = await pgDb
    .insert(SubscriptionPlansTable)
    .values(plans)
    .onConflictDoNothing()
    .returning();

  console.log(`✅ Seeded ${inserted.length} subscription plans`);

  // Print summary
  if (inserted.length > 0) {
    console.log("\n📊 Plan Summary:");
    for (const plan of inserted) {
      console.log(`\n  ${plan.displayName} (${plan.name}):`);
      console.log(`    - 월 구독료: $${plan.priceUsd}`);
      console.log(`    - 월간 할당량: ${plan.monthlyQuota} 크레딧`);
      console.log(
        `    - 정기 충전: ${plan.refillAmount} 크레딧 / ${plan.refillIntervalHours}시간마다`,
      );
      console.log(`    - 최대 누적: ${plan.maxRefillBalance} 크레딧까지`);
      console.log(
        `    - 이월 여부: ${plan.rolloverEnabled ? "이월 가능 (누적)" : "이월 안됨 (리셋)"}`,
      );
    }
  }

  console.log("\n✅ 구독 플랜 시드 데이터 생성 완료\n");
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import("@workspace/env");
  seedPlans()
    .then(() => {
      console.log("\n✅ Seed completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    });
}
