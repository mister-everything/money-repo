import { userService } from "@service/auth";
import { safeGetSession } from "@/lib/auth/server";

export async function GET() {
  const session = await safeGetSession();

  if (session) {
    const isSessionValid = await userService.isSessionValid(
      session?.session.id,
      session?.user.id,
    );
    if (isSessionValid) {
      return Response.json({ message: "Session is valid", success: true });
    }
  }
  return Response.json({ message: "Session is not valid", success: false });
}
