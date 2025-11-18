import { WorkbookCreateForm } from "@/components/workbook/workbook-create-form";

export default function ProbCreatePage() {
  return (
    <div className="flex flex-col p-4">
      <div className="w-max-3xl mx-auto">
        <div className="mb-4 py-6 flex justify-start items-center gap-4">
          <h1 className="text-2xl font-semibold text-foreground">
            어떤 문제집을 만들고 싶나요?
          </h1>
          <p className="text-sm text-muted-foreground">
            (* 한 문제집은 총 10개의 문제로 구성됩니다.)
          </p>
        </div>

        <WorkbookCreateForm />
      </div>
    </div>
  );
}
