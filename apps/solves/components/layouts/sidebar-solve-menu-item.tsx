"use client";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function SidebarSolveMenuItem({
  rootHref,
  inProgressHref,
  completedHref,
  ...sidebarMenuItemProps
}: {
  rootHref: string;
  inProgressHref: string;
  completedHref: string;
} & React.ComponentProps<typeof SidebarMenuItem>) {
  const { setOpenMobile, state } = useSidebar();
  const path = usePathname();

  const showSubMenu = useMemo(
    () =>
      state === "expanded" &&
      [rootHref, inProgressHref, completedHref].some((href) => path === href),
    [state, path, rootHref, inProgressHref, completedHref],
  );

  return (
    <SidebarMenuItem {...sidebarMenuItemProps}>
      <SidebarMenuButton isActive={path === rootHref} asChild>
        <Link
          className="w-full"
          href={rootHref}
          onClick={() => setOpenMobile(false)}
        >
          <BookOpen />
          문제 풀기
        </Link>
      </SidebarMenuButton>

      <div
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out overflow-y-auto"
        style={{
          maxHeight: showSubMenu ? "400px" : "0",
          opacity: showSubMenu ? 1 : 0,
        }}
      >
        <SidebarMenuSub>
          <SidebarMenuSubItem>
            <SidebarMenuSubButton asChild isActive={path === inProgressHref}>
              <Link href={inProgressHref}>풀고 있는 문제집</Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem>
            <SidebarMenuSubButton asChild isActive={path === completedHref}>
              <Link href={completedHref}>다 푼 문제집</Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        </SidebarMenuSub>
      </div>
    </SidebarMenuItem>
  );
}
