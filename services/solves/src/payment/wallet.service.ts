import { eq } from "drizzle-orm";
import { pgDb } from "../db";
import { cache } from "./cache";
import { CacheKeys, CacheTTL } from "./cache-keys";
import { CreditWalletTable } from "./schema";
import type { Wallet } from "./types";

/**
 * Wallet Service
 *
 * 책임: 지갑 생성 및 조회
 * 특징:
 * - 사용자당 1개 지갑 (unique index)
 * - 캐싱으로 빠른 조회
 * - getOrCreate 패턴 지원
 */
export const walletService = {
  /**
   * 사용자 지갑 생성
   * @param userId - 사용자 ID
   * @returns 생성된 지갑
   */
  createWallet: async (userId: string): Promise<Wallet> => {
    const [wallet] = await pgDb
      .insert(CreditWalletTable)
      .values({
        userId,
        balance: "0",
        version: 0,
      })
      .returning();

    // 캐시 저장
    await cache.setex(
      CacheKeys.walletBalance(wallet.id),
      CacheTTL.WALLET_BALANCE,
      wallet.balance,
    );

    return wallet as Wallet;
  },

  /**
   * 사용자 ID로 지갑 조회
   * @param userId - 사용자 ID
   * @returns 지갑 또는 null
   */
  getWalletByUserId: async (userId: string): Promise<Wallet | null> => {
    const [wallet] = await pgDb
      .select()
      .from(CreditWalletTable)
      .where(eq(CreditWalletTable.userId, userId))
      .limit(1);

    if (!wallet) {
      return null;
    }

    // 잔액 캐시 저장
    await cache.setex(
      CacheKeys.walletBalance(wallet.id),
      CacheTTL.WALLET_BALANCE,
      wallet.balance,
    );

    return wallet as Wallet;
  },

  /**
   * 지갑 조회 또는 생성 (없으면 자동 생성)
   * @param userId - 사용자 ID
   * @returns 지갑
   */
  getOrCreateWallet: async (userId: string): Promise<Wallet> => {
    // 1) 기존 지갑 조회
    const existing = await walletService.getWalletByUserId(userId);
    if (existing) {
      return existing;
    }

    // 2) 없으면 생성
    try {
      return await walletService.createWallet(userId);
    } catch (error: unknown) {
      // 동시 생성 시도로 인한 unique constraint 에러 처리
      if (
        error instanceof Error &&
        error.message.includes("unique constraint")
      ) {
        // 재조회
        const wallet = await walletService.getWalletByUserId(userId);
        if (wallet) {
          return wallet;
        }
      }
      throw error;
    }
  },
};
