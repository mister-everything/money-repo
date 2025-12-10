import { workBookService } from "@service/solves";
import { isPublished } from "@service/solves/shared";
import { PublicError } from "@workspace/error";
import { notFound, redirect } from "next/navigation";
import { Streamdown } from "streamdown";
import z from "zod";
import { InDevelopment } from "@/components/ui/in-development";
import { WorkbookReport } from "@/components/workbook/workbook-report";
import { getSession } from "@/lib/auth/server";

const message = `
## REPORT 화면입니다. 어떻게할지 고민중 🚧

OWNER 용 report 화면

1. 친구에게 링크 공유하기 등 
3. 배포 이후 수정할수있는 부분 수정할수있는부분 수정
4. 문제집 + 디테일 (랭킹이나, 푼사람들? 문제 정답확률등?)

`.trim();

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

  const book = await workBookService.getWorkBookWithBlocks(id);
  if (!book) notFound();
  if (!isPublished(book)) redirect(`/workbooks/${id}/edit`);

  return (
    <div className="flex w-full h-screen px-4 gap-4">
      <div className="flex-1">
        <InDevelopment className="mx-4 my-8">
          <Streamdown mode="static">{message}</Streamdown>
        </InDevelopment>
        <WorkbookReport book={book} />
      </div>
    </div>
  );
}
