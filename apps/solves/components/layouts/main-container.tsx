"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "../ui/sidebar";

export function MainContainer({ children }: { children: React.ReactNode }) {
  const { state, isMobile } = useSidebar();
  const isExpanded = state === "expanded";
  return (
    <main
      className={cn(
        "flex-1 overflow-hidden w-full h-screen transition-all duration-200",
        !isMobile && isExpanded && "p-2",
      )}
    >
      <div
        className={cn(
          "trasition-all duration-200 @container/main h-full overflow-y-auto relative bg-secondary/70 dark:bg-card/40",
          !isMobile && isExpanded && "border rounded-3xl",
        )}
      >
        {children}
      </div>
    </main>
  );
}
