import { workBookService } from "@service/solves";
import { getSession } from "@/lib/auth/server";
import { logger } from "@/lib/logger";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const { id: workBookId } = await params;

  try {
    const data = await workBookService.getLatestWorkBookResultWithAnswers(
      workBookId,
      session.user.id,
    );

    if (!data) {
      return nextFail("Result not found");
    }

    return nextOk(data);
  } catch (error) {
    logger.error("Error fetching result:", error);
    return nextFail("Internal Server Error");
  }
}
