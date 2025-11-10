import { eq, sql } from "drizzle-orm";
import { pgDb } from "../db";
import { CacheKeys, CacheTTL } from "./cache-keys";
import {
  CreditLedgerTable,
  CreditWalletTable,
  UsageEventsTable,
} from "./schema";
import { sharedCache } from "./shared-cache";
import { AIPrice } from "./types";
import { calculateCost, toDecimal } from "./utils";

/**
 * Credit Service
 *
 * 핵심 전략:
 * - 빠른 응답: 백그라운드 차감 (balance > 0만 체크)
 * - 안전한 충전: 비관적 락 + 순차 처리
 * - 멱등성 보장: 캐시 + DB 인덱스
 */
export const creditService = {
  /**
   * 크레딧 차감
   * @param params - 차감 파라미터
   * @returns 사용 이벤트 정보
   */
  deductCredit: async (params: {
    walletId: string;
    userId: string;
    inputTokens: number;
    outputTokens: number;
    price: AIPrice;
    calls?: number;
    idempotencyKey: string;
  }) => {
    const {
      walletId,
      userId,
      inputTokens,
      outputTokens,
      price,
      calls = 0,
      idempotencyKey,
    } = params;

    // 1) 캐시에서 멱등성 체크
    const cachedResponse = await sharedCache.get(
      CacheKeys.idempotency(idempotencyKey),
    );
    if (cachedResponse) {
      return JSON.parse(cachedResponse);
    }
    // 3) 비용 계산
    const cost = calculateCost(price, {
      input: inputTokens,
      output: outputTokens,
    });

    // 4) DB 트랜잭션 (FOR UPDATE로 충분)
    const result = await pgDb.transaction(async (tx) => {
      const queryResult = await tx.execute<{
        id: string;
        balance: string;
      }>(sql`
        SELECT id, balance FROM ${CreditWalletTable}
        WHERE id = ${walletId}
        FOR UPDATE
      `);

      const wallet = queryResult.rows[0];
      if (!wallet) throw new Error("지갑을 찾을 수 없습니다");

      const currentBalance = Number(wallet.balance);
      if (currentBalance <= 0) {
        throw new Error("크레딧이 부족합니다");
      }

      const newBalance = Math.max(0, currentBalance - cost.totalMarketCost);

      // 4-2) 잔액 차감
      await tx
        .update(CreditWalletTable)
        .set({
          balance: toDecimal(newBalance),
          updatedAt: new Date(),
        })
        .where(eq(CreditWalletTable.id, walletId));

      // 4-3) 원장 기록
      await tx.insert(CreditLedgerTable).values({
        walletId,
        userId,
        kind: "debit",
        delta: toDecimal(-cost.totalMarketCost),
        runningBalance: toDecimal(newBalance),
        idempotencyKey,
        reason: `AI usage: ${price.provider}:${price.model}`,
      });

      // 4-4) 사용 이벤트 기록
      const [usage] = await tx
        .insert(UsageEventsTable)
        .values({
          userId,
          priceId: price.id,
          provider: price.provider,
          model: price.model,
          calls,
          billableCredits: toDecimal(cost.totalMarketCost),
          idempotencyKey,
        })
        .returning({ id: UsageEventsTable.id });

      return { usageId: usage.id, newBalance: toDecimal(newBalance) };
    });

    // 5) 캐시 업데이트
    const response = {
      success: true,
      usageId: result.usageId,
      newBalance: result.newBalance,
    };

    await Promise.all([
      // 5-1) 잔액 캐시 갱신 (userId 기반)
      sharedCache.setex(
        CacheKeys.userWallet(userId),
        CacheTTL.USER_WALLET,
        JSON.stringify({
          id: walletId,
          userId: userId,
          balance: result.newBalance,
        }),
      ),
      // 5-2) 멱등성 키 저장
      sharedCache.setex(
        CacheKeys.idempotency(idempotencyKey),
        CacheTTL.IDEMPOTENCY,
        JSON.stringify(response),
      ),
    ]);

    return response;
  },
};
