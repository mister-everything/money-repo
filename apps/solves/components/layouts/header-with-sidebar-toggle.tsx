"use client";

import { isNull } from "@workspace/util";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { SidebarIcon } from "../ui/custom-icon";
import { useSidebar } from "../ui/sidebar";

export function HeaderWithSidebarToggle({
  children,
  showBlur: showBlurProp,
  className,
}: React.ComponentProps<"div"> & { showBlur?: boolean }) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = useMemo(() => {
    return state === "collapsed";
  }, [state]);
  const showBlur = useMemo(() => {
    if (showBlurProp != undefined) return showBlurProp;
    return Boolean(isCollapsed || children);
  }, [isCollapsed || Boolean(children), showBlurProp]);
  return (
    <div
      className={cn(
        "w-full flex gap-2 items-center px-4 py-3 sticky inset-0 z-10",
        className,
      )}
    >
      {showBlur && (
        <div
          className="absolute inset-0 -bottom-4 backdrop-blur-sm pointer-events-none"
          style={{
            maskImage:
              "linear-gradient(to bottom, black 60%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 60%, transparent 100%)",
          }}
        />
      )}
      <div className="relative z-10 flex gap-1 items-center w-full">
        {isCollapsed && (
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
        )}
        {isNull(children) ? null : (
          <div className="min-h-9 flex items-center px-2">{children}</div>
        )}
      </div>
    </div>
  );
}
