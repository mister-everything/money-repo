import { and, eq, sql } from "drizzle-orm";
import { pgDb } from "../db";
import { CacheKeys, CacheTTL } from "./cache-keys";
import { creditService } from "./credit.service";
import {
  CreditLedgerTable,
  CreditWalletTable,
  SubscriptionPeriodsTable,
  SubscriptionPlansTable,
  SubscriptionsTable,
} from "./schema";
import { sharedCache } from "./shared-cache";
import type {
  CancelSubscriptionResponse,
  CheckRefillResponse,
  CreateSubscriptionResponse,
  RenewSubscriptionResponse,
  SubscriptionPlan,
} from "./types";
import { DistributedLock, IdempotencyKeys, toDecimal } from "./utils";
import { walletService } from "./wallet.service";

/**
 * Subscription Service
 *
 * 설계 원칙:
 * - 충전/리필은 순차 처리 (비관적 락 + 분산 락)
 * - SubscriptionPeriodsTable로 월간 상태 관리
 * - 기존 CreditWallet 시스템 완전 호환
 */
export const subscriptionService = {
  getAllPlans: async (): Promise<SubscriptionPlan[]> => {
    const plans = await pgDb
      .select()
      .from(SubscriptionPlansTable)
      .where(eq(SubscriptionPlansTable.isActive, true))
      .orderBy(SubscriptionPlansTable.price);

    return plans as SubscriptionPlan[];
  },

  /**
   * 구독 플랜 조회 (DB 직접 조회) - 어드민용
   */
  getPlan: async (planId: string): Promise<SubscriptionPlan> => {
    const [plan] = await pgDb
      .select()
      .from(SubscriptionPlansTable)
      .where(eq(SubscriptionPlansTable.id, planId))
      .limit(1);

    if (!plan) {
      throw new Error(`플랜을 찾을 수 없습니다: ${planId}`);
    }

    return plan as SubscriptionPlan;
  },

  /**
   * 사용자의 활성 구독 조회
   */
  getActiveSubscription: async (userId: string): Promise<any | null> => {
    const cached = await sharedCache.get(CacheKeys.subscription(userId));
    if (cached) {
      return JSON.parse(cached);
    }

    const [subscription] = await pgDb
      .select()
      .from(SubscriptionsTable)
      .where(
        and(
          eq(SubscriptionsTable.userId, userId),
          eq(SubscriptionsTable.status, "active"),
        ),
      )
      .limit(1);

    if (!subscription) {
      return null;
    }

    await sharedCache.setex(
      CacheKeys.subscription(userId),
      CacheTTL.SUBSCRIPTION,
      JSON.stringify(subscription),
    );

    return subscription as any;
  },

  /**
   * 구독 생성
   * - 지갑 생성 (또는 기존 사용)
   * - Subscription + SubscriptionPeriod 생성
   * - 초기 크레딧 지급
   */
  createSubscription: async (
    userId: string,
    planId: string,
  ): Promise<CreateSubscriptionResponse> => {
    // 1) 기존 활성 구독 확인
    const existingSub = await subscriptionService.getActiveSubscription(userId);
    if (existingSub) {
      throw new Error(
        "이미 활성 구독이 있습니다. 플랜 변경은 upgrade를 사용하세요.",
      );
    }

    // 2) 플랜 정보 조회
    const plan = await subscriptionService.getPlan(planId);
    if (!plan.isActive) {
      throw new Error("비활성화된 플랜입니다.");
    }

    // 3) 트랜잭션: 지갑 + 구독 + 기간 + 크레딧 지급
    const result = await pgDb.transaction(async (tx) => {
      // 3-1) 지갑 조회 또는 생성
      const wallet = await walletService.getOrCreateWallet(userId);

      // 3-2) 구독 생성
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const [subscription] = await tx
        .insert(SubscriptionsTable)
        .values({
          userId,
          planId,
          walletId: wallet.id,
          status: "active",
          startedAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        })
        .returning({ id: SubscriptionsTable.id });

      // 3-3) 구독 기간 생성 (첫 기간)
      const monthlyQuota = Number(plan.monthlyQuota);
      const idempotencyKey = IdempotencyKeys.forGrant(subscription.id, now);

      await tx.insert(SubscriptionPeriodsTable).values({
        subscriptionId: subscription.id,
        planId: plan.id,
        periodStart: now,
        periodEnd: periodEnd,
        status: "active",
        periodType: "initial",
        creditsGranted: toDecimal(monthlyQuota),
        refillCount: 0,
      });

      // 3-4) 지갑 조회 (FOR UPDATE)
      const queryResult = await tx.execute<{
        id: string;
        balance: string;
        version: number;
      }>(sql`
        SELECT id, balance, version FROM ${CreditWalletTable}
        WHERE id = ${wallet.id}
        FOR UPDATE
      `);

      const walletData = queryResult.rows[0];
      if (!walletData) throw new Error("지갑을 찾을 수 없습니다");

      const currentBalance = Number(walletData.balance);
      const newBalance = currentBalance + monthlyQuota;

      // 3-5) 크레딧 지급
      await tx
        .update(CreditWalletTable)
        .set({
          balance: toDecimal(newBalance),
          version: walletData.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(CreditWalletTable.id, wallet.id));

      // 3-6) 원장 기록
      await tx.insert(CreditLedgerTable).values({
        walletId: wallet.id,
        userId,
        kind: "subscription_grant",
        delta: toDecimal(monthlyQuota),
        runningBalance: toDecimal(newBalance),
        idempotencyKey,
        reason: `${plan.name} 구독 시작 (월간 크레딧)`,
      });

      return {
        subscriptionId: subscription.id,
        walletId: wallet.id,
        initialCredits: toDecimal(monthlyQuota),
      };
    });

    // 4) 캐시 무효화
    await Promise.all([
      sharedCache.del(CacheKeys.subscription(userId)),
      sharedCache.del(CacheKeys.userBalance(userId)),
    ]);

    return {
      success: true,
      ...result,
    };
  },

  /**
   * 정기 충전 체크 및 실행
   * - 분산 락으로 중복 방지
   * - 리필 간격 및 횟수 체크
   * - 비관적 락으로 충전
   */
  checkAndRefillCredits: async (
    userId: string,
  ): Promise<CheckRefillResponse> => {
    // 1) 분산 락 획득 (중복 충전 방지)
    const lock = new DistributedLock(
      CacheKeys.refillLock(userId),
      CacheTTL.REFILL_LOCK,
    );

    const acquired = await lock.acquire();
    if (!acquired) {
      return { refilled: false };
    }

    try {
      // 2) 활성 구독 조회
      const subscription =
        await subscriptionService.getActiveSubscription(userId);
      if (!subscription) {
        return { refilled: false };
      }

      // 3) 플랜 정보 조회 (캐시 사용)
      const plan = await subscriptionService.getPlan(subscription.planId);

      // 4) 현재 기간 조회
      const [currentPeriod] = await pgDb
        .select()
        .from(SubscriptionPeriodsTable)
        .where(
          and(
            eq(SubscriptionPeriodsTable.subscriptionId, subscription.id),
            eq(SubscriptionPeriodsTable.status, "active"),
          ),
        )
        .orderBy(sql`${SubscriptionPeriodsTable.periodStart} DESC`)
        .limit(1);

      if (!currentPeriod) {
        throw new Error("활성 구독 기간을 찾을 수 없습니다");
      }

      // 5) 월간 최대 횟수 체크
      if (currentPeriod.refillCount >= plan.maxRefillCount) {
        return {
          refilled: false,
          newBalance: await creditService.getBalance(userId),
        };
      }

      // 6) 마지막 충전 시각 확인
      const now = new Date();
      const lastRefill = currentPeriod.lastRefillAt
        ? new Date(currentPeriod.lastRefillAt)
        : new Date(currentPeriod.periodStart);

      const hoursSinceLastRefill =
        (now.getTime() - lastRefill.getTime()) / (1000 * 60 * 60);

      // 충전 간격이 안 지났으면 스킵
      if (hoursSinceLastRefill < plan.refillIntervalHours) {
        const nextRefillAt = new Date(
          lastRefill.getTime() + plan.refillIntervalHours * 60 * 60 * 1000,
        );
        return {
          refilled: false,
          nextRefillAt,
        };
      }

      // 7) 트랜잭션: 정기 충전
      const result = await pgDb.transaction(async (tx) => {
        const refillAmount = Number(plan.refillAmount);

        // 7-1) 지갑 조회 (FOR UPDATE)
        const queryResult = await tx.execute<{
          id: string;
          balance: string;
          version: number;
        }>(sql`
          SELECT id, balance, version FROM ${CreditWalletTable}
          WHERE id = ${subscription.walletId}
          FOR UPDATE
        `);

        const wallet = queryResult.rows[0];
        if (!wallet) throw new Error("지갑을 찾을 수 없습니다");

        const currentBalance = Number(wallet.balance);
        const newBalance = currentBalance + refillAmount;

        // 7-2) 지갑 업데이트
        await tx
          .update(CreditWalletTable)
          .set({
            balance: toDecimal(newBalance),
            version: wallet.version + 1,
            updatedAt: new Date(),
          })
          .where(eq(CreditWalletTable.id, subscription.walletId));

        // 7-3) 원장 기록
        const idempotencyKey = IdempotencyKeys.forRefill(
          subscription.id,
          currentPeriod.periodStart,
          currentPeriod.refillCount + 1,
        );

        await tx.insert(CreditLedgerTable).values({
          walletId: subscription.walletId,
          userId,
          kind: "subscription_refill",
          delta: toDecimal(refillAmount),
          runningBalance: toDecimal(newBalance),
          idempotencyKey,
          reason: `정기 자동 충전 (${plan.refillIntervalHours}시간마다)`,
        });

        // 7-4) 구독 기간 업데이트 (refillCount, lastRefillAt) - SQL INCREMENT 사용
        await tx.execute(sql`
          UPDATE ${SubscriptionPeriodsTable}
          SET refill_count = refill_count + 1,
              last_refill_at = ${now}
          WHERE id = ${currentPeriod.id}
        `);

        return {
          refillAmount: toDecimal(refillAmount),
          newBalance: toDecimal(newBalance),
        };
      });

      // 8) 캐시 무효화
      await Promise.all([
        sharedCache.del(CacheKeys.subscription(userId)),
        sharedCache.del(CacheKeys.userBalance(userId)),
      ]);

      const nextRefillAt = new Date(
        now.getTime() + plan.refillIntervalHours * 60 * 60 * 1000,
      );

      return {
        refilled: true,
        ...result,
        nextRefillAt,
      };
    } finally {
      // 락 해제
      await lock.release();
    }
  },

  /**
   * 구독 갱신
   * - 기존 Period 완료 처리, 새 Period 생성
   */
  renewSubscription: async (
    subscriptionId: string,
  ): Promise<RenewSubscriptionResponse> => {
    const result = await pgDb.transaction(async (tx) => {
      // 1) 구독 정보 조회 (FOR UPDATE)
      const queryResult = await tx.execute<{
        id: string;
        userId: string;
        planId: string;
        walletId: string;
        status: string;
        startedAt: Date;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        canceledAt: Date | null;
        expiredAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
      }>(sql`
        SELECT * FROM ${SubscriptionsTable}
        WHERE id = ${subscriptionId}
        FOR UPDATE
      `);

      const subscription = queryResult.rows[0];
      if (!subscription) {
        throw new Error("구독을 찾을 수 없습니다.");
      }

      if (subscription.status !== "active") {
        throw new Error("활성 구독이 아닙니다.");
      }

      // 2) 플랜 정보 조회 (캐시 사용)
      const plan = await subscriptionService.getPlan(subscription.planId);

      // 3) 현재 기간 완료 처리
      await tx
        .update(SubscriptionPeriodsTable)
        .set({ status: "completed" })
        .where(
          and(
            eq(SubscriptionPeriodsTable.subscriptionId, subscriptionId),
            eq(SubscriptionPeriodsTable.status, "active"),
          ),
        );

      // 4) 지갑 조회 (FOR UPDATE)
      const walletResult = await tx.execute<{
        id: string;
        balance: string;
        version: number;
      }>(sql`
        SELECT id, balance, version FROM ${CreditWalletTable}
        WHERE id = ${subscription.walletId}
        FOR UPDATE
      `);

      const wallet = walletResult.rows[0];
      if (!wallet) throw new Error("지갑을 찾을 수 없습니다.");

      const oldBalance = Number(wallet.balance);
      const monthlyQuota = Number(plan.monthlyQuota);
      let newBalance: number;
      let creditsGranted: string;

      const newPeriodStart = subscription.currentPeriodEnd;
      const newPeriodEnd = new Date(newPeriodStart);
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

      const idempotencyKey = IdempotencyKeys.forGrant(
        subscriptionId,
        newPeriodStart,
      );

      // 5) 월간 크레딧 지급 (이월 비활성화: 기존 잔액 리셋)
      if (oldBalance > 0) {
        await tx.insert(CreditLedgerTable).values({
          walletId: subscription.walletId,
          userId: subscription.userId,
          kind: "subscription_reset",
          delta: toDecimal(-oldBalance),
          runningBalance: "0",
          idempotencyKey: `reset:${idempotencyKey}`,
          reason: "월간 갱신 시 잔액 리셋 (미사용 크레딧 소멸)",
        });
      }

      newBalance = monthlyQuota;
      creditsGranted = toDecimal(monthlyQuota);

      await tx.insert(CreditLedgerTable).values({
        walletId: subscription.walletId,
        userId: subscription.userId,
        kind: "subscription_grant",
        delta: toDecimal(monthlyQuota),
        runningBalance: toDecimal(newBalance),
        idempotencyKey,
        reason: "월간 구독 갱신 (새 크레딧)",
      });

      // 6) 지갑 업데이트
      await tx
        .update(CreditWalletTable)
        .set({
          balance: toDecimal(newBalance),
          version: wallet.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(CreditWalletTable.id, subscription.walletId));

      // 7) 새 구독 기간 생성
      await tx.insert(SubscriptionPeriodsTable).values({
        subscriptionId,
        planId: plan.id,
        periodStart: newPeriodStart,
        periodEnd: newPeriodEnd,
        status: "active",
        periodType: "renewal",
        creditsGranted,
        refillCount: 0,
      });

      // 8) 구독 기간 연장
      await tx
        .update(SubscriptionsTable)
        .set({
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd,
          updatedAt: new Date(),
        })
        .where(eq(SubscriptionsTable.id, subscriptionId));

      return {
        newPeriodStart,
        newPeriodEnd,
        creditsGranted,
        newBalance: toDecimal(newBalance),
      };
    });

    // 캐시 무효화
    const subscription = await pgDb
      .select()
      .from(SubscriptionsTable)
      .where(eq(SubscriptionsTable.id, subscriptionId))
      .limit(1);

    if (subscription[0]) {
      await Promise.all([
        sharedCache.del(CacheKeys.subscription(subscription[0].userId)),
        sharedCache.del(CacheKeys.userBalance(subscription[0].userId)),
      ]);
    }

    return {
      success: true,
      ...result,
    };
  },

  /**
   * 구독 취소
   */
  cancelSubscription: async (
    subscriptionId: string,
  ): Promise<CancelSubscriptionResponse> => {
    const result = await pgDb.transaction(async (tx) => {
      const [subscription] = await tx
        .select()
        .from(SubscriptionsTable)
        .where(eq(SubscriptionsTable.id, subscriptionId))
        .limit(1);

      if (!subscription) {
        throw new Error("구독을 찾을 수 없습니다.");
      }

      if (subscription.status !== "active") {
        throw new Error("이미 취소되었거나 만료된 구독입니다.");
      }

      const now = new Date();
      await tx
        .update(SubscriptionsTable)
        .set({
          status: "canceled",
          canceledAt: now,
          updatedAt: now,
        })
        .where(eq(SubscriptionsTable.id, subscriptionId));

      return {
        canceledAt: now,
        validUntil: subscription.currentPeriodEnd,
      };
    });

    // 캐시 무효화
    const [subscription] = await pgDb
      .select()
      .from(SubscriptionsTable)
      .where(eq(SubscriptionsTable.id, subscriptionId))
      .limit(1);

    if (subscription) {
      await sharedCache.del(CacheKeys.subscription(subscription.userId));
    }

    return {
      success: true,
      ...result,
    };
  },

  /**
   * 만료된 구독 일괄 처리 (Cron Job용)
   */
  expireSubscriptions: async (): Promise<number> => {
    const now = new Date();

    const result = await pgDb
      .update(SubscriptionsTable)
      .set({
        status: "expired",
        expiredAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(SubscriptionsTable.status, "canceled"),
          sql`${SubscriptionsTable.currentPeriodEnd} <= ${now}`,
        ),
      );

    return result.rowCount || 0;
  },
};
