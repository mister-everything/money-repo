import { workBookService } from "@service/solves";
import { notFound } from "next/navigation";
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

  // @TODO published 인지 체크해야함
  const book = await workBookService.getWorkBookWithoutAnswer(id);
  if (!book) notFound();

  return (
    <div className="flex w-full px-4">
      <WorkBookSolve workBook={book} />
    </div>
  );
}
