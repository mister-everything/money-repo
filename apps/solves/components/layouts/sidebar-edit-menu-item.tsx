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
  inProgressBooksHref,
  publishedBooksHref,
  ...sidebarMenuItemProps
}: {
  rootHref: string;
  inProgressBooksHref: string;
  publishedBooksHref: string;
} & React.ComponentProps<typeof SidebarMenuItem>) {
  const { setOpenMobile, state } = useSidebar();
  const path = usePathname();

  const showSubMenu = useMemo(
    () =>
      state === "expanded" &&
      [rootHref, inProgressBooksHref].some((href) => path === href),
    [state, path, rootHref, inProgressBooksHref],
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
            <SidebarMenuSubButton
              asChild
              isActive={path === inProgressBooksHref}
            >
              <Link href={inProgressBooksHref}>만들고 있는 문제집</Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem>
            <SidebarMenuSubButton
              asChild
              isActive={path === publishedBooksHref}
            >
              <Link href={publishedBooksHref}>발행된 문제집</Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        </SidebarMenuSub>
      </div>
    </SidebarMenuItem>
  );
}
