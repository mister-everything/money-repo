import { getWallet } from "@/lib/auth/get-balance";
import { getSession } from "@/lib/auth/server";
import { nextOk } from "@/lib/protocol/next-route-helper";

export async function GET() {
  const session = await getSession();
  const wallet = await getWallet(session.user.id);

  return nextOk(Number(wallet.balance));
}
