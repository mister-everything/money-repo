import { createCache } from "@workspace/cache";
import { and, eq, sql } from "drizzle-orm";
import { pgDb } from "../db";
import { CacheKeys, CacheTTL } from "./cache-keys";
import {
  AiProviderPricesTable,
  CreditLedgerTable,
  CreditWalletTable,
  IdempotencyKeysTable,
  UsageEventsTable,
} from "./schema";
import type {
  AIPrice,
  CreditPurchaseParams,
  CreditPurchaseResponse,
  DeductCreditParams,
  DeductCreditResponse,
} from "./types";

// 캐시 인스턴스 (REDIS_URL이 있으면 Redis, 없으면 MemoryCache)
const cache = createCache({ forceMemory: true });

/**
 * Payment Service
 *
 * 핵심 전략:
 * - Cache: 빠른 읽기 (잔액, 가격, 멱등성 체크)
 * - DB: 신뢰의 원천 (모든 쓰기 작업)
 * - 낙관적 락: 크레딧 차감 (높은 동시성 대응)
 * - 비관적 락: 크레딧 충전 (충돌 거의 없음)
 */
export const paymentService = {
  /**
   * 잔액 조회 (Cache 우선 → DB Fallback)
   * @param walletId - 지갑 UUID
   * @returns 잔액 (문자열)
   */
  getBalance: async (walletId: string): Promise<string> => {
    // 1) 캐시에서 먼저 확인 (빠름!)
    const cached = await cache.get(CacheKeys.walletBalance(walletId));
    if (cached) {
      return cached;
    }

    // 2) 캐시 미스 → DB 조회
    const wallet = await pgDb
      .select()
      .from(CreditWalletTable)
      .where(eq(CreditWalletTable.id, walletId))
      .limit(1);

    if (!wallet[0]) {
      throw new Error("지갑을 찾을 수 없습니다");
    }

    // 3) 캐시 저장 (10분)
    await cache.setex(
      CacheKeys.walletBalance(walletId),
      CacheTTL.WALLET_BALANCE,
      wallet[0].balance,
    );

    return wallet[0].balance;
  },

  /**
   * AI 가격 조회 (Cache 우선)
   * @param provider - AI 제공자
   * @param model - 모델명
   * @returns 가격 정보
   */
  getAIPrice: async (provider: string, model: string): Promise<AIPrice> => {
    // 1) 캐시 확인
    const cached = await cache.get(CacheKeys.aiPrice(provider, model));
    if (cached) {
      return JSON.parse(cached);
    }

    // 2) DB 조회
    const price = await pgDb
      .select()
      .from(AiProviderPricesTable)
      .where(
        and(
          eq(AiProviderPricesTable.provider, provider),
          eq(AiProviderPricesTable.model, model),
          eq(AiProviderPricesTable.isActive, true),
        ),
      )
      .limit(1);

    if (!price[0]) {
      throw new Error(`가격 정보를 찾을 수 없습니다: ${provider}/${model}`);
    }

    // 3) 캐시 저장 (1시간)
    await cache.setex(
      CacheKeys.aiPrice(provider, model),
      CacheTTL.AI_PRICE,
      JSON.stringify(price[0]),
    );

    return price[0] as AIPrice;
  },

  /**
   * 크레딧 차감 (멱등성 + 낙관적 락)
   * @param params - 차감 파라미터
   * @returns 사용 이벤트 ID
   */
  deductCredit: async (
    params: DeductCreditParams,
  ): Promise<DeductCreditResponse> => {
    const {
      walletId,
      userId,
      provider,
      model,
      inputTokens,
      outputTokens,
      cachedTokens = 0,
      calls = 0,
      idempotencyKey,
    } = params;

    // 1) 캐시에서 멱등성 체크 (빠름!)
    const cachedResponse = await cache.get(
      CacheKeys.idempotency(idempotencyKey),
    );
    if (cachedResponse) {
      return JSON.parse(cachedResponse);
    }

    // 2) 가격 조회 (캐시 활용)
    const price = await paymentService.getAIPrice(provider, model);

    // 3) 비용 계산
    const inputCost = (inputTokens / 1000) * Number(price.inputTokenPrice);
    const outputCost = (outputTokens / 1000) * Number(price.outputTokenPrice);
    const vendorCostUsd = inputCost + outputCost;
    const billableCredits = vendorCostUsd * Number(price.markupRate);

    // 4) DB 트랜잭션 (낙관적 락 with 재시도)
    let retries = 3;
    let result: { usageId: string; newBalance: string } | undefined;

    while (retries > 0) {
      try {
        result = await pgDb.transaction(async (tx) => {
          // 4-1) 지갑 조회
          const [wallet] = await tx
            .select()
            .from(CreditWalletTable)
            .where(eq(CreditWalletTable.id, walletId))
            .limit(1);

          if (!wallet) throw new Error("지갑을 찾을 수 없습니다");

          const currentBalance = Number(wallet.balance);
          if (currentBalance < billableCredits) {
            throw new Error("크레딧이 부족합니다");
          }

          const newBalance = currentBalance - billableCredits;

          // 4-2) 낙관적 락으로 잔액 차감
          const updated = await tx
            .update(CreditWalletTable)
            .set({
              balance: newBalance.toFixed(6),
              version: wallet.version + 1,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(CreditWalletTable.id, walletId),
                eq(CreditWalletTable.version, wallet.version),
              ),
            );

          if (updated.rowCount === 0) {
            throw new Error("VERSION_CONFLICT");
          }

          // 4-3) 원장 기록
          await tx.insert(CreditLedgerTable).values({
            walletId,
            kind: "debit",
            delta: (-billableCredits).toFixed(6),
            runningBalance: newBalance.toFixed(6),
            idempotencyKey,
            reason: `${provider}:${model} API 사용`,
          });

          // 4-4) 사용 이벤트 기록
          const [usage] = await tx
            .insert(UsageEventsTable)
            .values({
              userId,
              walletId,
              priceId: price.id,
              provider,
              model,
              inputTokens,
              outputTokens,
              cachedTokens,
              calls,
              vendorCostUsd: vendorCostUsd.toFixed(6),
              billableCredits: billableCredits.toFixed(6),
              idempotencyKey,
            })
            .returning({ id: UsageEventsTable.id });

          return { usageId: usage.id, newBalance: newBalance.toFixed(6) };
        });

        break; // 성공 시 루프 종료
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message === "VERSION_CONFLICT" &&
          retries > 1
        ) {
          retries--;
          await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms 대기
          continue;
        }
        throw error;
      }
    }

    if (!result) throw new Error("크레딧 차감 실패");

    // 5) 캐시 업데이트
    const response = { success: true as const, usageId: result.usageId };

    await Promise.all([
      // 5-1) 잔액 캐시 갱신
      cache.setex(
        CacheKeys.walletBalance(walletId),
        CacheTTL.WALLET_BALANCE,
        result.newBalance,
      ),
      // 5-2) 멱등성 키 저장 (24시간)
      cache.setex(
        CacheKeys.idempotency(idempotencyKey),
        CacheTTL.IDEMPOTENCY,
        JSON.stringify(response),
      ),
    ]);

    // 6) DB 멱등성 키도 저장 (캐시 장애 대비)
    await pgDb.insert(IdempotencyKeysTable).values({
      key: idempotencyKey,
      userId,
      resourceType: "usage_event",
      resourceId: result.usageId,
      response: JSON.stringify(response),
      expiresAt: new Date(Date.now() + CacheTTL.IDEMPOTENCY * 1000),
    });

    return response;
  },

  /**
   * 크레딧 충전 (결제 완료 시 호출)
   * @param params - 충전 파라미터
   * @returns 새로운 잔액
   */
  creditPurchase: async (
    params: CreditPurchaseParams,
  ): Promise<CreditPurchaseResponse> => {
    const { walletId, userId, creditAmount, invoiceId, idempotencyKey } =
      params;

    // 멱등성 체크
    const cached = await cache.get(CacheKeys.idempotency(idempotencyKey));
    if (cached) return JSON.parse(cached);

    // DB 트랜잭션 (비관적 락 - 충전은 충돌 거의 없음)
    const result = await pgDb.transaction(async (tx) => {
      // 지갑 조회 (FOR UPDATE)
      const queryResult = await tx.execute<{
        id: string;
        balance: string;
        version: number;
      }>(sql`
        SELECT id, balance, version FROM ${CreditWalletTable} 
        WHERE id = ${walletId} 
        FOR UPDATE
      `);

      const wallet = queryResult.rows[0];
      if (!wallet) throw new Error("지갑을 찾을 수 없습니다");

      const currentBalance = Number(wallet.balance);
      const newBalance = currentBalance + creditAmount;

      // 잔액 증가
      await tx
        .update(CreditWalletTable)
        .set({
          balance: newBalance.toFixed(6),
          updatedAt: new Date(),
        })
        .where(eq(CreditWalletTable.id, walletId));

      // 원장 기록
      await tx.insert(CreditLedgerTable).values({
        walletId,
        kind: "purchase",
        delta: creditAmount.toFixed(6),
        runningBalance: newBalance.toFixed(6),
        idempotencyKey,
        reason: `invoice:${invoiceId}`,
      });

      return { newBalance };
    });

    const response = { success: true as const, newBalance: result.newBalance };

    // 캐시 갱신
    await Promise.all([
      cache.setex(
        CacheKeys.walletBalance(walletId),
        CacheTTL.WALLET_BALANCE,
        result.newBalance.toFixed(6),
      ),
      cache.setex(
        CacheKeys.idempotency(idempotencyKey),
        CacheTTL.IDEMPOTENCY,
        JSON.stringify(response),
      ),
    ]);

    // DB 멱등성 키 저장
    await pgDb.insert(IdempotencyKeysTable).values({
      key: idempotencyKey,
      userId,
      resourceType: "invoice",
      resourceId: invoiceId,
      response: JSON.stringify(response),
      expiresAt: new Date(Date.now() + CacheTTL.IDEMPOTENCY * 1000),
    });

    return response;
  },

  /**
   * 캐시 무효화 (관리자 작업 등에서 사용)
   * @param walletId - 지갑 UUID
   */
  invalidateWalletCache: async (walletId: string): Promise<void> => {
    await cache.del(CacheKeys.walletBalance(walletId));
  },

  /**
   * AI 가격 캐시 무효화 (가격 변경 시 사용)
   * @param provider - AI 제공자
   * @param model - 모델명
   */
  invalidatePriceCache: async (
    provider: string,
    model: string,
  ): Promise<void> => {
    await cache.del(CacheKeys.aiPrice(provider, model));
  },
};
