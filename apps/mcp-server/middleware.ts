import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // Check authorization for /mcp routes
  if (pathname.startsWith("/mcp")) {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        "Unauthorized: Missing or invalid Authorization header",
        {
          status: 401,
          headers: {
            "WWW-Authenticate": "Bearer",
          },
        },
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (token != process.env.MCP_TOKEN) {
      return new Response("Forbidden: Invalid token", {
        status: 403,
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/mcp/:path*"],
};
