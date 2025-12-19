import { walletService } from "@service/solves";
import { PublicError } from "@workspace/error";

export const getWallet = async (userId: string) => {
  const wallet = await walletService.getOrCreateWallet(userId);
  return wallet!;
};

export const getWalletThrowIfNotEnoughBalance = async (userId: string) => {
  const wallet = await getWallet(userId);
  if (Number(wallet.balance) <= 0) {
    throw new PublicError("크레딧이 부족합니다");
  }
  return wallet;
};
