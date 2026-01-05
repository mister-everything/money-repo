import { creditService } from "@service/solves";
import { PublicError } from "@workspace/error";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth/server";
import { nextFail } from "@/lib/protocol/next-route-helper";

const bodySchema = z.object({
  amount: z.number(),
  reason: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await getUser(); // 어드민 세션 보장

    const { id } = await params;
    if (!id) {
      return nextFail("사용자 ID가 필요합니다.");
    }

    const { amount, reason, idempotencyKey } = bodySchema.parse(
      await request.json(),
    );

    const { newBalance, ledgerId } = await creditService.grantCredit({
      userId: id,
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
