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
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="font-bold">
              <Link className="" href={"/"}>
                Solves
                <span className="text-lg text-primary">.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <SidebarLink href="/workbooks">문제 풀기</SidebarLink>
          </SidebarMenuButton>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton>
                <SidebarLink href="/workbooks/in-progress">
                  풀고 있는 문제집
                </SidebarLink>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton>
                <SidebarLink href="/workbooks/completed">
                  다 푼 문제집
                </SidebarLink>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </SidebarMenuItem>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarLink href="/workbooks">문제 풀기</SidebarLink>
            <SidebarLink href="/workbooks/new">문제 생성</SidebarLink>
          </SidebarMenu>
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
