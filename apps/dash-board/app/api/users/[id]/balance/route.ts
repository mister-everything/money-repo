import { userService } from "@service/auth";
import { walletService } from "@service/solves";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/server";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    const isAdminCheck = await userService.isAdmin(session.user.id);
    const { id } = await params;
    const wallet = await walletService.getWalletByUserId(id);

    // 관리자일 경우에만 접근 가능
    if (!isAdminCheck) return nextFail("Forbidden", 403);
    // 지갑이 없을 경우 (없을경우 생성하는 로직으로 변경할수도있음)
    if (!wallet) return nextFail("not wallet", 404);

    return nextOk(Number(wallet.balance));
  } catch (error) {
    return nextFail(error);
  }
}
