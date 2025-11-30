import { workBookService } from "@service/solves";
import { notFound } from "next/navigation";
import { GoBackButton } from "@/components/layouts/go-back-button";
import { WorkBookReview } from "@/components/workbook/workbook-review";
import { getSession } from "@/lib/auth/server";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const workBook = await workBookService.getWorkBookWithoutAnswer(id);
  if (!workBook) notFound();

  // 결과 및 제출 답안 가져오기
  const resultData = await workBookService.getLatestWorkBookResultWithAnswers(
    id,
    session.user.id,
  );

  if (!resultData) {
    notFound();
  }

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden">
      <div className="px-6 py-6 flex justify-between">
        <GoBackButton />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <WorkBookReview
            workBook={workBook}
            submitResult={resultData.result}
            answers={resultData.answers}
          />
        </div>
      </div>
    </div>
  );
}
