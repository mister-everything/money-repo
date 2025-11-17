import { userService } from "@service/auth";
import { safeGetSession } from "@/lib/auth/server";
import { nextOk } from "@/lib/protocol/next-route-helper";

export async function GET() {
  try {
    const session = await safeGetSession();

    if (session) {
      const isSessionValid = await userService.isSessionValid(
        session?.session.id,
        session?.user.id,
      );
      if (isSessionValid) {
        return nextOk({ message: "Session is valid", success: true });
      }
    }
    return nextOk({ message: "Session is not valid", success: false });
  } catch (error) {
    console.error("Error checking session:", error);
    return nextOk({ message: "Session is not valid", success: false });
  }
}
