import { workBookService } from "@service/solves";
import { BlockType, blockDisplayNames } from "@service/solves/shared";
import { HeaderWithSidebarToggle } from "@/components/layouts/header-with-sidebar-toggle";
import { Label } from "@/components/ui/label";
import { WorkbookCreateForm } from "@/components/workbook/workbook-create-form";
import { getSession } from "@/lib/auth/server";
import { WorkbookOptions } from "@/store/types";
import { LatestWorkbooks } from "./latest-workbooks";

export default async function WorkBookCreatePage({
  searchParams,
}: {
  searchParams: Promise<Partial<WorkbookOptions> | undefined>;
}) {
  const session = await getSession();

  const initialFormData = await searchParams;

  // categoryId가 string이면 number로 변환
  if (initialFormData?.categoryId) {
    initialFormData.categoryId = Number(initialFormData.categoryId);
  }

  if (
    initialFormData?.blockTypes &&
    !Array.isArray(initialFormData.blockTypes)
  ) {
    initialFormData.blockTypes = [initialFormData.blockTypes];
  }

  const isMaxInprogressWorkbookCreateCount =
    await workBookService.isMaxInprogressWorkbookCreateCount(session.user.id);

  const latest3Workbooks = await workBookService.searchMyWorkBooks({
    userId: session.user.id,
    limit: 3,
    // 완성되지 않은 문제집이 최대 개수를 초과하면 완성되지 않은 문제집만 조회
    isPublished: isMaxInprogressWorkbookCreateCount ? false : undefined,
  });

  return (
    <div className="flex flex-col">
      <HeaderWithSidebarToggle />
      <div className="w-max-3xl mx-auto flex flex-col w-full p-6 pt-0!">
        <WorkbookCreateForm
          isMaxInprogressWorkbookCreateCount={
            isMaxInprogressWorkbookCreateCount
          }
          initialFormData={{
            ...{
              situation: "",
              categoryId: undefined,
              blockTypes: Object.keys(blockDisplayNames) as BlockType[],
              ageGroup: "all",
              difficulty: "",
            },
            ...initialFormData,
          }}
        />

        <div className="flex flex-col gap-1 mt-12">
          <Label className="font-semibold mb-4">
            {isMaxInprogressWorkbookCreateCount
              ? "만들고 있는 문제집"
              : "최근 생성한 문제집"}
          </Label>

          {latest3Workbooks.length > 0 ? (
            <LatestWorkbooks initialWorkBooks={latest3Workbooks} />
          ) : (
            <div className="text-center text-muted-foreground py-18 w-full h-full flex items-center justify-center">
              <p>새로운 문제집을 만들어보세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
