import { workBookService } from "@service/solves";
import { notFound } from "next/navigation";
import { WorkBookReview } from "@/components/workbook/workbook-review";
import { getSession } from "@/lib/auth/server";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const reviewSession = await workBookService.getReviewSession(
    id,
    session.user.id,
  );
  if (!reviewSession) notFound();

  return <WorkBookReview session={reviewSession} />;
}
