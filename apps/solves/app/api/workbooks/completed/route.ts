import { workBookService } from "@service/solves";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/server";
import { logger } from "@/lib/logger";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";
import { SearchCompletedWorkbooksRequest } from "./types";

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const option = SearchCompletedWorkbooksRequest.parse(params);
    const session = await getSession();
    const workBookSessions = await workBookService.searchWorkBookSessions(
      session.user.id,
      option,
    );
    return nextOk(workBookSessions);
  } catch (error) {
    logger.error("Error fetching workbook sessions:", error);
    return nextFail(error);
  }
}
