import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarLink,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarRail />
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div className="w-full group-data-[state=collapsed]:hidden items-center gap-4">
                <Link href={"/"} className="font-bold flex-1">
                  Solves
                  <span className="text-lg text-primary">.</span>
                </Link>
                <SidebarTrigger />
              </div>
            </SidebarMenuButton>
            <SidebarMenuButton
              className="font-bold hidden group-data-[state=collapsed]:block"
              asChild
            >
              <SidebarTrigger />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarLink href="/workbooks">문제 풀기</SidebarLink>
          <SidebarMenuItem>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild>
                  <Link href="/workbooks/in-progress">풀고 있는 문제집</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild>
                  <Link href="/workbooks/completed">다 푼 문제집</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarLink href="/workbooks/new">문제 생성</SidebarLink>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex flex-col items-stretch space-y-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <NavUser />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
