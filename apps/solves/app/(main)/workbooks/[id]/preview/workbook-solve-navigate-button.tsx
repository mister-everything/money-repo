import { workBookService } from "@service/solves";
import { isNull } from "@workspace/util";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { safeGetSession } from "@/lib/auth/server";

export async function WorkbookSolveNavigateButton({
  workBookId,
}: {
  workBookId: string;
}) {
  let submitSession: "in-progress" | "submitted" | "not-started" | null = null;
  const session = await safeGetSession();
  if (session?.user?.id) {
    submitSession = await workBookService.getSubmitSessioStatus(
      workBookId,
      session.user.id,
    );
  }

  if (isNull(submitSession))
    return (
      <Link href={`/workbooks/${workBookId}/solve`}>
        <Button
          size="lg"
          variant={"outline"}
          className="py-6 w-full lg:w-lg rounded-full bg-primary/5 text-primary border-primary backdrop-blur-sm font-bold text-lg hover:bg-primary hover:text-primary-foreground"
        >
          문제집 풀러가기
        </Button>
      </Link>
    );

  return (
    <Button
      size="lg"
      variant={"outline"}
      className="py-6 w-full lg:w-lg rounded-full bg-primary/5 text-primary border-primary backdrop-blur-sm font-bold text-lg hover:bg-primary hover:text-primary-foreground"
    >
      문제집 풀러가기 v2
    </Button>
  );
}
