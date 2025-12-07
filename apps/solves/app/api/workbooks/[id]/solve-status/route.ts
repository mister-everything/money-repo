import { workBookService } from "@service/solves";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/server";
import { logger } from "@/lib/logger";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();

    const status = await workBookService.getSubmitStatus(id, session.user.id);

    return nextOk(status);
  } catch (error) {
    logger.error("Error fetching workbook solve status:", error);
    return nextFail(error);
  }
}
