import { workBookService } from "@service/solves";
import { notFound } from "next/navigation";
import { Streamdown } from "streamdown";
import { InDevelopment } from "@/components/ui/in-development";
import { WorkbookPublicPreview } from "@/components/workbook/workbook-public-preview";

const message = `
## PREVIEW 화면입니다. 어떻게할지 고민중 🚧

> public 한 preview 화면임 

1. 로그인 없이 미리보기, SSO 

`.trim();

export default async function WorkbookPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const book = await workBookService.getWorkBookWithoutAnswer(id, {
    isPublished: true,
  });
  if (!book) notFound();

  return (
    <div className="flex w-full h-screen px-4 gap-4">
      <div className="flex-1">
        <InDevelopment className="mx-4 my-8">
          <Streamdown mode="static">{message}</Streamdown>
        </InDevelopment>
        <WorkbookPublicPreview book={book} />
      </div>
    </div>
  );
}
