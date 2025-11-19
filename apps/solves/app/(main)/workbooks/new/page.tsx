import { InDevelopment } from "@/components/ui/in-development";
import { Label } from "@/components/ui/label";

import { WorkbookCreateForm } from "@/components/workbook/workbook-create-form";

export default function ProbCreatePage() {
  return (
    <div className="flex flex-col p-6">
      <div className="w-max-3xl mx-auto flex flex-col gap-8">
        <div className="flex justify-start items-center gap-4">
          <h1 className="text-2xl font-semibold text-foreground">
            어떤 문제집을 만들고 싶나요?
          </h1>
          <p className="text-sm text-muted-foreground">
            (* 한 문제집은 총 10개의 문제로 구성됩니다.)
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
