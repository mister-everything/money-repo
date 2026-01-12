"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "../ui/sidebar";

export function MainContainer({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();
  const isExpanded = state === "expanded";
  return (
    <main
      className={cn(
        "flex-1 overflow-hidden w-full h-screen transition-all duration-200",
        isExpanded && "p-2",
      )}
    >
      <div
        className={cn(
          "trasition-all duration-200 @container/main h-full overflow-y-auto relative bg-secondary dark:bg-card/40",
          isExpanded && "border rounded-3xl",
        )}
      >
        {children}
      </div>
    </main>
  );
}
