import { userService } from "@service/auth";
import { walletService } from "@service/solves";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/server";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // 관리자일 경우에만 접근 가능
  const session = await getSession();
  const isAdminCheck = await userService.isAdmin(session.user.id);
  if (!isAdminCheck) {
    return nextFail("Forbidden", 403);
  }

  const { id } = await params;
  const wallet = await walletService.getWalletByUserId(id);
  console.dir(wallet, { depth: null });
  if (!wallet) {
    return nextOk("not wallet");
  }
  return nextOk(Number(wallet.balance));
}
