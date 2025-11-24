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
  myBooksHref,
  ...sidebarMenuItemProps
}: {
  rootHref: string;
  myBooksHref: string;
} & React.ComponentProps<typeof SidebarMenuItem>) {
  const { setOpenMobile, state } = useSidebar();
  const path = usePathname();

  const showSubMenu = useMemo(
    () =>
      state === "expanded" &&
      [rootHref, myBooksHref].some((href) => path === href),
    [state, path, rootHref, myBooksHref],
  );

  return (
    <SidebarMenuItem {...sidebarMenuItemProps}>
      <SidebarMenuButton isActive={path === rootHref} asChild>
        <Link href={rootHref} onClick={() => setOpenMobile(false)}>
          <Pencil />
          문제 생성
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
            <SidebarMenuSubButton asChild isActive={path === myBooksHref}>
              <Link href={myBooksHref}>내가 만든 문제집</Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        </SidebarMenuSub>
      </div>
    </SidebarMenuItem>
  );
}
