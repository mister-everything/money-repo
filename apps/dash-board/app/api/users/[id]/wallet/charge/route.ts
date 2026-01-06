import { creditService } from "@service/solves";
import { z } from "zod";
import { checkAdmin, getUser } from "@/lib/auth/server";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

const requestSchema = z.object({
  amount: z.number(),
  reason: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const { id: userId } = await getUser(); // 어드민 세션 보장

    if (!(await checkAdmin(userId))) return nextFail("권한이 없습니다.");

    const { amount, reason, idempotencyKey } = requestSchema.parse(
      await request.json(),
    );

    const { newBalance, ledgerId } = await creditService.grantCredit({
      userId,
      amount,
      reason,
      idempotencyKey,
    });

    return nextOk({
      ledgerId,
      newBalance: Number(newBalance),
    });
  } catch (error) {
    return nextFail(error);
  }
}
