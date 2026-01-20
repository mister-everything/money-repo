import { NextRequest } from "next/server";
import { nextFail } from "@/lib/protocol/next-route-helper";

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    params.workbookId; // commit용
  } catch (error) {
    return nextFail(error);
  }
}
