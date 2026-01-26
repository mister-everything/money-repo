import { HeaderWithSidebarToggle } from "@/components/layouts/header-with-sidebar-toggle";
import { WorkbookInstantSolve } from "@/components/workbook/instant/workbook-instant-solve";
import { Suspense } from "react";

export default function WorkbookInstantSolvePage() {
  return (
    <div className="flex flex-col">
      <HeaderWithSidebarToggle>
        <span className="text-sm font-semibold hover:text-muted-foreground transition-colors">
          바로 풀기
        </span>
      </HeaderWithSidebarToggle>
      <div className="w-max-4xl mx-auto flex flex-col w-full p-6 pt-0!">
        <Suspense fallback={<div>Loading...</div>}>
          <WorkbookInstantSolve />
        </Suspense>
      </div>
    </div>
  );
}
