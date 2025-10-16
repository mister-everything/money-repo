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
import { CreateSubscriptionPlan } from "./types";

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

  const plans: CreateSubscriptionPlan[] = [
    {
      name: "free",
      displayName: "Free Plan",
      description: "개인 개발자와 취미 프로젝트를 위한 무료 플랜",
      plans: [
        { type: "text", text: "월 1,000 크레딧 제공" },
        { type: "text", text: "자동 충전: 6시간마다 50 크레딧 (월 최대 10회)" },
        { type: "text", text: "기본 AI 모델 사용 가능" },
        { type: "text", text: "커뮤니티 지원" },
        { type: "text", text: "미사용 크레딧 이월 불가 (매월 리셋)" },
        { type: "text", text: "고급 모델 사용 제한" },
      ],
      price: "0.00",
      monthlyQuota: "1000.000000",
      refillAmount: "50.000000",
      refillIntervalHours: 6,
      maxRefillCount: 10,

      isActive: true,
    },
    {
      name: "pro",
      displayName: "Pro Plan",
      description: "전문가와 스타트업을 위한 프로 플랜",
      plans: [
        { type: "text", text: "월 10,000 크레딧 제공" },
        {
          type: "text",
          text: "자동 충전: 6시간마다 500 크레딧 (월 최대 20회)",
        },
        { type: "text", text: "모든 AI 모델 사용 가능" },
        { type: "text", text: "우선 지원" },
        { type: "text", text: "크레딧 이월 가능 (누적)" },
        { type: "text", text: "사용 통계 및 분석" },
        { type: "text", text: "API 접근" },
        { type: "text", text: "월간 리포트 제공" },
      ],
      price: "130000.00",
      monthlyQuota: "10000.000000",
      refillAmount: "500.000000",
      refillIntervalHours: 6,
      maxRefillCount: 20,

      isActive: true,
    },
    {
      name: "business",
      displayName: "Business Plan",
      description: "대규모 팀과 엔터프라이즈를 위한 비즈니스 플랜",
      plans: [
        { type: "text", text: "월 100,000 크레딧 제공" },
        {
          type: "text",
          text: "자동 충전: 6시간마다 5,000 크레딧 (월 최대 50회)",
        },
        { type: "text", text: "모든 AI 모델 무제한 사용" },
        { type: "text", text: "전담 지원팀" },
        { type: "text", text: "크레딧 이월 가능 (누적)" },
        { type: "text", text: "커스텀 모델 파인튜닝" },
        { type: "text", text: "SLA 보장" },
        { type: "text", text: "전용 인프라" },
        { type: "text", text: "컨설팅 서비스" },
      ],
      price: "650000.00",
      monthlyQuota: "100000.000000",
      refillAmount: "5000.000000",
      refillIntervalHours: 6,
      maxRefillCount: 50,
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
      console.log(`    - 월 구독료: ${plan.price}원`);
      console.log(`    - 월간 할당량: ${plan.monthlyQuota} 크레딧`);
      console.log(
        `    - 정기 충전: ${plan.refillAmount} 크레딧 / ${plan.refillIntervalHours}시간마다`,
      );
      console.log(`    - 최대 충전 횟수: 월 ${plan.maxRefillCount}회`);
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
