import { workBookService } from "@service/solves";
import { isPublished } from "@service/solves/shared";
import { PublicError } from "@workspace/error";
import { notFound, redirect } from "next/navigation";
import { Streamdown } from "streamdown";
import z from "zod";
import { InDevelopment } from "@/components/ui/in-development";
import { WorkbookPreview } from "@/components/workbook/workbook-preview";
import { getSession } from "@/lib/auth/server";

const message = `
## PREVIEW 화면입니다. 어떻게할지 고민중 🚧

> public 한 preview **OR** owner 용 preview 분리해야할 필요있어보임

1. 로그인 없이 미리보기, SSO 
2. 문제집 주인인경우 친구에게 링크 공유하기 등 
3. 문제집 주인인경우 배포 이후 수정할수있는 부분 수정할수있는부분 수정
4. 문제집 + 디테일 (랭킹이나, 푼사람들? 문제 정답확률등?)
`.trim();

export default async function WorkbookPreviewPage({
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
          <Streamdown>{message}</Streamdown>
        </InDevelopment>
        <WorkbookPreview book={book} />
      </div>
    </div>
  );
}
