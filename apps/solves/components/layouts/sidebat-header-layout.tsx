"use client";

import { isNull } from "@workspace/util";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { SidebarIcon } from "../ui/custom-icon";
import { useSidebar } from "../ui/sidebar";

export function SidebarHeaderLayout({
  children,
  className,
  menuName,
  ...props
}: React.ComponentProps<"div"> & { menuName?: string }) {
  const { toggleSidebar } = useSidebar();

  return (
    <div className={cn("flex flex-col w-full relative", className)} {...props}>
      <header className="w-full flex gap-2 items-center px-4 py-3 sticky inset-0 z-10">
        <div
          className="absolute inset-0 -bottom-4 backdrop-blur-sm pointer-events-none"
          style={{
            maskImage:
              "linear-gradient(to bottom, black 40%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 40%, transparent 100%)",
          }}
        />
        <div className="relative z-10 flex gap-1 items-center w-full">
          <Button
            data-sidebar="trigger"
            data-slot="sidebar-trigger"
            variant="ghost"
            size="icon"
            className="shadow-none"
            onClick={toggleSidebar}
          >
            <SidebarIcon />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>

          {isNull(menuName) ? null : (
            <div className="min-h-9 flex items-center px-2">
              <span className="text-sm font-semibold hover:text-muted-foreground transition-colors">
                {menuName}
              </span>
            </div>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
