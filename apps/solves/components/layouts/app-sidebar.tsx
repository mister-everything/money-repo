import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";
import { SidebarEditMenuItem } from "./sidebar-edit-menu-item";
import { SidebarSolveMenuItem } from "./sidebar-solve-menu-item";

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas" variant="inset">
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
          <SidebarSolveMenuItem
            rootHref="/workbooks"
            solveSessionsHref="/workbooks/session"
          />
          <SidebarEditMenuItem
            rootHref="/workbooks/creator/new"
            myWorkbooksHref="/workbooks/creator"
          />
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
