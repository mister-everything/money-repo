import { HeaderWithSidebarToggle } from "@/components/layouts/header-with-sidebar-toggle";
import { WorkbookInstantForm } from "@/components/workbook/instant/workbook-instant-form";

export default async function WorkBookAiCreatePage() {
  return (
    <div className="flex flex-col">
      <HeaderWithSidebarToggle>
        <span className="text-sm font-semibold hover:text-muted-foreground transition-colors">
          문제집 생성
        </span>
      </HeaderWithSidebarToggle>
      <div className="w-max-3xl mx-auto flex flex-col w-full p-6 pt-0!">
        <WorkbookInstantForm />
      </div>
    </div>
  );
}
