"use client";

import { BookOpenCheck, LibraryIcon, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";
import { NavUser } from "./nav-user";

export function AppSidebar() {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarRail />
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="w-full group-data-[state=collapsed]:hidden items-center gap-4 justify-between flex my-1">
              <Link href={"/"} className="font-bold flex-1">
                <Button
                  variant="ghost"
                  className="rounded-full font-bold gap-0 px-2! logo-text"
                >
                  Solves
                  <span className="text-lg text-primary">.</span>
                </Button>
              </Link>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>풀기</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/workbooks"}>
                <Link href="/workbooks" onClick={() => setOpenMobile(false)}>
                  <LibraryIcon />
                  <span>문제 풀기</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/workbooks/session"}
              >
                <Link
                  href="/workbooks/session"
                  onClick={() => setOpenMobile(false)}
                >
                  <BookOpenCheck />
                  <span>내가 푼 문제집</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>만들기</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/workbooks/creator/new"}
              >
                <Link
                  href="/workbooks/creator/new"
                  onClick={() => setOpenMobile(false)}
                >
                  <Plus />
                  <span>문제 생성</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/workbooks/creator"}
              >
                <Link
                  href="/workbooks/creator"
                  onClick={() => setOpenMobile(false)}
                >
                  <Pencil />
                  <span>내가 만든 문제집</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex flex-col items-stretch space-y-2">
        <SidebarMenu>
          <NavUser />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
