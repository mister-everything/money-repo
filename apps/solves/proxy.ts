import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { Step } from "./components/onboarding/types";
import { safeGetSession } from "./lib/auth/server";

const ABOUT_YOU_URL = "/about-you";

const PUBLIC_PATHS = ["/api/ai/chat/models"];

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

  if (!!session) {
    const hasNickname = Boolean(session.user.nickname);
    const hasImage = Boolean(session.user.image);
    const hasConsentedAt = Boolean(session.user.consentedAt);
    const hasReferralSource = Boolean(session.user.referralSource);
    const hasOccupation = Boolean(session.user.occupation);
    const shouldRedirectToAboutYou =
      !hasNickname ||
      !hasImage ||
      !hasConsentedAt ||
      !hasReferralSource ||
      !hasOccupation;

    if (shouldRedirectToAboutYou && !pathname.startsWith(ABOUT_YOU_URL)) {
      const aboutYouUrl = new URL(ABOUT_YOU_URL, request.url);
      const steps: string[] = [];
      (!hasNickname || !hasImage) && steps.push(Step.NICKNAME, Step.IMAGE);
      (!hasReferralSource || !hasOccupation) &&
        steps.push(Step.THEME, Step.SURVEY);
      !hasConsentedAt && steps.push(Step.POLICY);
      aboutYouUrl.searchParams.set("steps", steps.join(","));
      logger.debug(
        `redirect to about you: ${session.user.email}, steps: ${steps.join(",")}`,
      );
      aboutYouUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(aboutYouUrl);
    }
  }

  if (
    request.method === "GET" &&
    (/^\/workbooks$/.test(pathname) ||
      /^\/workbooks\/creator\/new$/.test(pathname) ||
      /^\/workbooks\/[^/]+\/preview$/.test(pathname) ||
      /^\/workbooks\/[^/]+\/comment$/.test(pathname) ||
      /^\/api\/categories$/.test(pathname) ||
      /^\/community$/.test(pathname) ||
      PUBLIC_PATHS.some((path) => pathname.startsWith(path)))
  ) {
    return NextResponse.next();
  }

  if (!session) {
    logger.warn(`proxy ${pathname} without session`);
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth|sign-in|policies).*)",
  ],
};
