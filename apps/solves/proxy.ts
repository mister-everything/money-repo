import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { safeGetSession } from "./lib/auth/server";

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
  // 워크북 preview 페이지는 로그인 없이 접근 가능 (공개 미리보기)
  if (/^\/workbooks\/[^/]+\/preview$/.test(pathname)) {
    return NextResponse.next();
  }
  const session = await safeGetSession();

  if (!session) {
    logger.warn(`proxy ${pathname} without session`);
    const signInUrl = new URL("/sign-in", request.url);
    // 원래 가려던 URL을 callbackUrl로 저장
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth|sign-in).*)",
  ],
};
