/**
 * Subscription Plans Seed Data
 *
 * 구독 플랜 초기 데이터 생성
 * - Free Plan: 무료 플랜 (소량 할당량 + 정기 충전)
 * - Pro Plan: 유료 플랜 (대량 할당량 + 정기 충전)
 */

import { pgDb } from "../db";
import { logger } from "../logger";
import { SubscriptionPlansTable } from "./schema";
import { CreateSubscriptionPlan } from "./types";

/**
 * 구독 플랜 시드 데이터 생성
 */
export const seedPlans = async () => {
  logger.info("🌱 Seeding Subscription Plans...");

  const plans: CreateSubscriptionPlan[] = [
    {
      name: "pro",
      displayName: "Pro Plan",
      description: "전문가와 스타트업을 위한 프로 플랜",
      plans: [
        { type: "text", text: "모든 AI 모델 사용 가능" },
        { type: "text", text: "우선 지원" },
        { type: "text", text: "크레딧 이월 가능 (누적)" },
        { type: "text", text: "사용 통계 및 분석" },
        { type: "text", text: "API 접근" },
        { type: "text", text: "월간 리포트 제공" },
      ],
      price: "9900",
      monthlyQuota: "10",
      refillAmount: "5",
      refillIntervalHours: 6,
      maxRefillCount: 10,
      isActive: true,
    },
    {
      name: "business",
      displayName: "Business Plan",
      description: "대규모 팀과 엔터프라이즈를 위한 비즈니스 플랜",
      plans: [
        { type: "text", text: "월 $1,000 크레딧 제공" },
        {
          type: "text",
          text: "자동 충전: 6시간마다 $50 크레딧 (월 최대 50회)",
        },
        { type: "text", text: "모든 AI 모델 무제한 사용" },
        { type: "text", text: "전담 지원팀" },
        { type: "text", text: "크레딧 이월 가능 (누적)" },
        { type: "text", text: "커스텀 모델 파인튜닝" },
        { type: "text", text: "SLA 보장" },
        { type: "text", text: "전용 인프라" },
        { type: "text", text: "컨설팅 서비스" },
      ],
      price: "50000",
      monthlyQuota: "50",
      refillAmount: "10",
      refillIntervalHours: 6,
      maxRefillCount: 10,
      isActive: true,
    },
  ];

  const inserted = await pgDb
    .insert(SubscriptionPlansTable)
    .values(plans)
    .onConflictDoNothing()
    .returning();

  logger.info(`✅ Seeded ${inserted.length} subscription plans`);

  // Print summary
  if (inserted.length > 0) {
    logger.info("\n📊 Plan Summary:");
    for (const plan of inserted) {
      logger.info(`\n  ${plan.displayName} (${plan.name}):`);
      logger.info(`    - 월 구독료: ${plan.price}원`);
      logger.info(`    - 월간 할당량: $${plan.monthlyQuota} 크레딧`);
      logger.info(
        `    - 정기 충전: $${plan.refillAmount} 크레딧 / ${plan.refillIntervalHours}시간마다`,
      );
      logger.info(`    - 최대 충전 횟수: 월 ${plan.maxRefillCount}회`);
    }
  }

  logger.info("\n✅ 구독 플랜 시드 데이터 생성 완료\n");
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import("@workspace/env");
  seedPlans()
    .then(() => {
      logger.info("\n✅ Seed completed!");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("❌ Seed failed:", error);
      process.exit(1);
    });
}
