import { workBookService } from "@service/solves";
import { notFound } from "next/navigation";
import { WorkBookSolve } from "@/components/workbook/workbook-solve";
import { getSession } from "@/lib/auth/server";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // 로그인 확인
  await getSession();

  const book = await workBookService.getWorkBookWithoutAnswer(id, {
    isPublished: true,
  });

  if (!book) notFound();

  return (
    <div className="flex w-full px-4">
      <WorkBookSolve workBook={book} />
    </div>
  );
}
