import { workBookService } from "@service/solves";
import { notFound } from "next/navigation";
import { GoBackButton } from "@/components/layouts/go-back-button";
import { WorkBookSolve } from "@/components/workbook/workbook-solve";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // const session = await getSession();

  // const hasPermission = await workBookService.hasWorkBookPermission(
  //   z.uuid().parse(id),
  //   session.user.id,
  // );

  // if (!hasPermission) throw new Error("문제집에 접근할 수 없습니다.");

  const book = await workBookService.getWorkBookWithoutAnswer(id);
  if (!book) notFound();

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden">
      <div className="px-6 py-6 flex justify-between">
        <GoBackButton />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <WorkBookSolve workBook={book} />
        </div>
      </div>
    </div>
  );
}
