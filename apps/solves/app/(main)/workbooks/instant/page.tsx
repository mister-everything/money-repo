import { GoBackButton } from "@/components/layouts/go-back-button";
import { SidebarController } from "@/components/ui/sidebar";
import { WorkbookInstant } from "@/components/workbook/instant/workbook-instant";

export default async function WorkBookAiCreatePage() {
  return (
    <div className="flex flex-col">
      <SidebarController openMounted={false} openUnmounted={true} />
      <div className="sticky top-0 left-0 z-20 p-4">
        <GoBackButton>뒤로가기</GoBackButton>
      </div>
      <div className="w-max-4xl mx-auto flex flex-col w-full p-6 pt-0!">
        <WorkbookInstant />
      </div>
    </div>
  );
}
