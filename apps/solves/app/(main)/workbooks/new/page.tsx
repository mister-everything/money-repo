import { workBookService } from "@service/solves";
import { InDevelopment } from "@/components/ui/in-development";
import { Label } from "@/components/ui/label";
import { WorkbookCreateForm } from "@/components/workbook/workbook-create-form";
import { getSession } from "@/lib/auth/server";

export default async function ProbCreatePage() {
  const session = await getSession();

  const isMaxInprogressWorkbookCreateCount =
    await workBookService.isMaxInprogressWorkbookCreateCount(session.user.id);

  const latest3Workbooks = await workBookService.searchMyWorkBooks({
    userId: session.user.id,
    limit: 3,
  });
  console.warn;
  return (
    <div className="flex flex-col p-6 lg:p-12">
      <div className="w-max-3xl mx-auto flex flex-col gap-8">
        <div className="flex justify-start items-center gap-4">
          <h1 className="text-2xl font-semibold text-foreground">
            어떤 문제집을 만들고 싶나요?
          </h1>
          <p className="text-xs text-warning">
            (* 한 문제집은 총 10개의 문제로 구성돼요.)
          </p>
        </div>

        <WorkbookCreateForm />

        <div className="flex flex-col gap-1 mt-4">
          <Label className="text-xl">최근 목록 </Label>
          <div className="w-full items-center gap-4 flex">
            <InDevelopment className="flex-1 h-[200px]" />
            <InDevelopment className="flex-1 h-[200px]" />
            <InDevelopment className="flex-1 h-[200px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
