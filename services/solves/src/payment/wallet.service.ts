import { eq } from "drizzle-orm";
import { INITIAL_CREDIT_BALANCE } from "../const";
import { pgDb } from "../db";
import { CacheKeys, CacheTTL } from "./cache-keys";
import { CreditWalletTable } from "./schema";
import { sharedCache } from "./shared-cache";
import type { Wallet } from "./types";
import { toDecimal } from "./utils";

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
   * @param initialBalance - 초기 밸런스 (선택적, 기본값은 env에서)
   * @returns 생성된 지갑
   */
  createWallet: async (
    userId: string,
    initialBalance?: number,
  ): Promise<Wallet> => {
    const balance = toDecimal(initialBalance ?? INITIAL_CREDIT_BALANCE);

    const [wallet] = await pgDb
      .insert(CreditWalletTable)
      .values({
        userId,
        balance,
      })
      .returning();

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

    // 캐시 저장 (userId 기반)
    await Promise.all([
      sharedCache.setex(
        CacheKeys.userBalance(userId),
        CacheTTL.USER_BALANCE,
        wallet.balance,
      ),
    ]);

    return wallet as Wallet;
  },

  /**
   * 지갑 조회 또는 생성 (없으면 자동 생성)
   * @param userId - 사용자 ID
   * @param initialBalance - 초기 밸런스 (선택적, 기본값은 env에서)
   * @returns 지갑
   */
  getOrCreateWallet: async (
    userId: string,
    initialBalance?: number,
  ): Promise<Wallet> => {
    // 1) 기존 지갑 조회
    const existing = await walletService.getWalletByUserId(userId);
    if (existing) {
      return existing;
    }

    // 2) 없으면 생성
    try {
      return await walletService.createWallet(userId, initialBalance);
    } catch (error: unknown) {
      // 동시 생성 시도로 인한 unique constraint 에러 처리
      if (
        error instanceof Error &&
        ((error as any).code === "23505" ||
          error.message.includes("unique constraint"))
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
