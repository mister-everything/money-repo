"use client";
import { Pencil } from "lucide-react";
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

export function SidebarEditMenuItem({
  rootHref,
  myWorkbooksHref,

  ...sidebarMenuItemProps
}: {
  rootHref: string;
  myWorkbooksHref: string;
} & React.ComponentProps<typeof SidebarMenuItem>) {
  const { setOpenMobile, state } = useSidebar();
  const path = usePathname();

  const showSubMenu = useMemo(
    () =>
      state === "expanded" &&
      [myWorkbooksHref, rootHref].some((href) => path === href),
    [state, path, rootHref, myWorkbooksHref],
  );

  return (
    <SidebarMenuItem {...sidebarMenuItemProps}>
      <SidebarMenuButton isActive={path === rootHref} asChild>
        <Link href={rootHref} onClick={() => setOpenMobile(false)}>
          <Pencil />
          {state === "expanded" && <span className="fade-300">문제 생성</span>}
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
            <SidebarMenuSubButton asChild isActive={path === myWorkbooksHref}>
              {state === "expanded" && (
                <Link href={myWorkbooksHref}>
                  <span className="fade-300">내가 만든 문제집</span>
                </Link>
              )}
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        </SidebarMenuSub>
      </div>
    </SidebarMenuItem>
  );
}
