"use client";

import {
  ArrowUpRight,
  BookOpenCheck,
  FlaskConicalIcon,
  LibraryIcon,
  Pencil,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
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
  useSidebar,
} from "@/components/ui/sidebar";

import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { NavUser } from "./nav-user";

export function AppSidebar() {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" variant="inset">
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
                isActive={pathname === "/workbooks/instant"}
              >
                <Link
                  href="/workbooks/instant"
                  onClick={() => setOpenMobile(false)}
                >
                  <FlaskConicalIcon />
                  <span>만들어서 풀기</span>
                  <Badge className="ml-auto rounded-full text-2xs">Beta</Badge>
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
      <SidebarFooter className="flex flex-col items-stretch space-y-4 px-2 pb-2">
        <Link
          href="/community"
          className={cn(
            "group hover:bg-secondary/60 flex flex-col gap-2 p-4 group rounded-lg fade-300",
          )}
          onClick={() => setOpenMobile(false)}
        >
          <div className="flex items-center gap-1 justify-between">
            <AnimatedShinyText
              shimmerWidth={120}
              className={cn("font-bold text-foreground", "mx-0 max-w-none")}
            >
              Small Talk
            </AnimatedShinyText>

            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            서비스에 대한 의견 또는 자유로운 이야기를 나눠보세요
          </p>
        </Link>

        <SidebarMenu>
          <NavUser />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
