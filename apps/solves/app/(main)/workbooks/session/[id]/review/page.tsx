import { workBookService } from "@service/solves";
import { notFound } from "next/navigation";

import { GoBackLayout } from "@/components/layouts/go-back-layout";
import { PolicyFooter } from "@/components/layouts/policy-footer";
import { WorkbookRecommendations } from "@/components/workbook/workbook-recommendations";
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

  const recommendations = await workBookService.getRecommendedWorkBooks({
    excludeWorkBookId: reviewSession.workBook.id,
    userId: session.user.id,
    categoryId: reviewSession.workBook.categoryId,
  });

  return (
    <GoBackLayout label="다른 문제집 보기">
      <WorkBookReview
        session={reviewSession}
        commentCount={reviewSession.commentCount}
      />

      <div className="max-w-6xl mx-auto w-full px-6 pb-16">
        <WorkbookRecommendations
          workBookId={reviewSession.workBook.id}
          likeCount={reviewSession.workBook.likeCount}
          isLiked={reviewSession.isLiked}
          recommendations={recommendations}
        />

        <div className="py-10 mt-14">
          <PolicyFooter />
        </div>
      </div>
    </GoBackLayout>
  );
}
