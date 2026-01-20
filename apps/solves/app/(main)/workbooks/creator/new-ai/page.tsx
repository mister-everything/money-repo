import { BlockType, blockDisplayNames } from "@service/solves/shared";
import { HeaderWithSidebarToggle } from "@/components/layouts/header-with-sidebar-toggle";
import { WorkbookCreateAiForm } from "@/components/workbook/workbook-create-ai-form";

import { WorkbookOptions } from "@/store/types";

export default async function WorkBookAiCreatePage({
  searchParams,
}: {
  searchParams: Promise<Partial<WorkbookOptions> | undefined>;
}) {
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

  return (
    <div className="flex flex-col">
      <HeaderWithSidebarToggle>
        <span className="text-sm font-semibold hover:text-muted-foreground transition-colors">
          문제집 생성
        </span>
      </HeaderWithSidebarToggle>
      <div className="w-max-3xl mx-auto flex flex-col w-full p-6 pt-0!">
        <WorkbookCreateAiForm
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
      </div>
    </div>
  );
}
