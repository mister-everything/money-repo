import { workBookService } from "@service/solves";
import { BlockType, blockDisplayNames } from "@service/solves/shared";
import { SidebarHeaderLayout } from "@/components/layouts/sidebat-header-layout";
import { Label } from "@/components/ui/label";
import { WorkbookCreateForm } from "@/components/workbook/workbook-create-form";
import { safeGetSession } from "@/lib/auth/server";
import { WorkbookOptions } from "@/store/types";
import { LatestWorkbooks } from "./latest-workbooks";
import { LoginPreviewSection } from "./login-preview-section";

export default async function WorkBookCreatePage({
  searchParams,
}: {
  searchParams: Promise<Partial<WorkbookOptions> | undefined>;
}) {
  const session = await safeGetSession();

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

  const isMaxInprogressWorkbookCreateCount = session?.user
    ? await workBookService.isMaxInprogressWorkbookCreateCount(session.user.id)
    : false;

  const latest3Workbooks = session?.user
    ? await workBookService.searchMyWorkBooks({
        userId: session.user.id,
        limit: 3,
        // 완성되지 않은 문제집이 최대 개수를 초과하면 완성되지 않은 문제집만 조회
        isPublished: isMaxInprogressWorkbookCreateCount ? false : undefined,
      })
    : [];

  const hasSession = !!session?.user;

  return (
    <SidebarHeaderLayout menuName="문제집 생성">
      <div className="flex flex-col w-full p-6 pt-0! h-full">
        <WorkbookCreateForm
          isMaxInprogressWorkbookCreateCount={
            isMaxInprogressWorkbookCreateCount
          }
          hasSession={hasSession}
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

        {hasSession ? (
          latest3Workbooks.length > 0 ? (
            <div className="flex flex-col gap-1 mt-12">
              <Label className="font-semibold mb-4">
                {isMaxInprogressWorkbookCreateCount
                  ? "만들고 있는 문제집"
                  : "최근 생성한 문제집"}
              </Label>
              <LatestWorkbooks initialWorkBooks={latest3Workbooks} />
            </div>
          ) : null
        ) : (
          <div className="flex-1 flex items-center justify-center w-full">
            <LoginPreviewSection />
          </div>
        )}
      </div>
    </SidebarHeaderLayout>
  );
}
