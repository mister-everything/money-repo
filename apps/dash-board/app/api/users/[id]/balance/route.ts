import { walletService } from "@service/solves";
import { nextOk } from "@/lib/protocol/next-route-helper";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = await params;
  const wallet = await walletService.getWalletByUserId(id);
  return nextOk(Number(wallet?.balance));
}
