import { creditService } from "@service/solves";
import { getSession } from "./server";

export const getBalance = async () => {
  const session = await getSession();
  const balance = await creditService.getBalance(session.user.id);
  if (isNaN(Number(balance))) {
    throw new Error("잔액을 찾을 수 없습니다");
  }
  return Number(balance);
};

export const checkHasEnoughBalance = async () => {
  const balance = await getBalance();
  console.log(`check balance ${balance}`);
  if (balance <= 0) {
    throw new Error("크레딧이 부족합니다");
  }
};
