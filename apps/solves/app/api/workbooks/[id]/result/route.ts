import { workBookService } from "@service/solves";
import { getSession } from "@/lib/auth/server";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const { id: workBookId } = await params;

  try {
    const result = await workBookService.getLatestWorkBookResult(
      workBookId,
      session.user.id,
    );

    if (!result) {
      return nextFail("Result not found");
    }

    return nextOk(result);
  } catch (error) {
    console.error("Error fetching result:", error);
    return nextFail("Internal Server Error");
  }
}
