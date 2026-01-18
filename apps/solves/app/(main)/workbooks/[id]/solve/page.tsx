import { workBookService } from "@service/solves";
import { BlockAnswerSubmit } from "@service/solves/shared";
import { notFound } from "next/navigation";
import { SidebarController } from "@/components/ui/sidebar";
import { WorkBookSolve } from "@/components/workbook/workbook-solve";
import { getSession } from "@/lib/auth/server";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const book = await workBookService.getWorkBookWithoutAnswer(id, {
    isPublished: true,
  });

  if (!book) notFound();

  const { session: workbookSession, isNewSession } =
    await workBookService.startOrResumeWorkBookSession(id, session.user.id);

  const savedAnswers = isNewSession
    ? {}
    : await workBookService
        .getSubmitAnswers(workbookSession.submitId)
        .then((answers) => {
          return answers.reduce(
            (acc, answer) => {
              acc[answer.blockId] = answer.submit;
              return acc;
            },
            {} as Record<string, BlockAnswerSubmit>,
          );
        });

  return (
    <div className="flex w-full px-4">
      <SidebarController openMounted={false} />
      <WorkBookSolve
        workBook={book}
        initialSession={workbookSession}
        savedAnswers={savedAnswers}
      />
    </div>
  );
}
