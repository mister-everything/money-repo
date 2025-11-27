import { type NextRequest, NextResponse } from "next/server";
import { safeGetSession } from "./lib/auth/server";
import { logger } from "@/lib/logger";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }
  if (pathname === "/") {
    return NextResponse.next();
  }
  const session = await safeGetSession();

  if (!session) {
    logger.warn(`proxy ${pathname} without session`);
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth|sign-in).*)",
  ],
};
