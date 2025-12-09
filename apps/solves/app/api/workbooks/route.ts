import { workBookService } from "@service/solves";
import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";
import { SearchWorkbooksRequest } from "./types";

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const option = SearchWorkbooksRequest.parse(params);
    const workBooks = await workBookService.searchWorkBooks({
      isPublished: true,
      limit: option.limit,
      page: option.page,
    });
    return nextOk(workBooks);
  } catch (error) {
    logger.error("Error fetching workbook sessions:", error);
    return nextFail(error);
  }
}
