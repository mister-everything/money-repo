import { walletService } from "@service/solves";
import { PublicError } from "@workspace/error";
import { getSession } from "./server";

export const getWallet = async () => {
  const session = await getSession();
  const wallet = await walletService.getOrCreateWallet(session.user.id);
  return wallet!;
};

export const getWalletThrowIfNotEnoughBalance = async () => {
  const wallet = await getWallet();
  if (Number(wallet.balance) <= 0) {
    throw new PublicError("크레딧이 부족합니다");
  }
  return wallet;
};
