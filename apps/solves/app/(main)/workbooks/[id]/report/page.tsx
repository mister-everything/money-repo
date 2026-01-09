import { workBookService } from "@service/solves";
import { isPublished } from "@service/solves/shared";
import { PublicError } from "@workspace/error";
import { notFound, redirect } from "next/navigation";
import z from "zod";
import { GoBackButton } from "@/components/layouts/go-back-button";
import { HeaderWithSidebarToggle } from "@/components/layouts/header-with-sidebar-toggle";
import { WorkbookReport } from "@/components/workbook/workbook-report";
import { getSession } from "@/lib/auth/server";

export default async function WorkbookReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSession();

  const isOwner = await workBookService.isWorkBookOwner(
    z.uuid().parse(id),
    session.user.id,
  );
  if (!isOwner) throw new PublicError("권한이 없습니다.");

  const book = await workBookService.getWorkBook(id);
  if (!book) notFound();
  if (!isPublished(book)) redirect(`/workbooks/${id}/edit`);

  const { blockStats, scoreDistribution, dailySolves } =
    await workBookService.getWorkBookReportStats(id);

  return (
    <div className="flex w-full h-full">
      <div className="flex-1">
        <HeaderWithSidebarToggle>
          <GoBackButton arrow={false} href="/workbooks/creator">
            뒤로가기
          </GoBackButton>
        </HeaderWithSidebarToggle>
        <WorkbookReport
          book={book}
          blockStats={blockStats}
          scoreDistribution={scoreDistribution}
          dailySolves={dailySolves}
        />
      </div>
    </div>
  );
}
