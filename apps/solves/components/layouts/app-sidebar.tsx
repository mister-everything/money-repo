import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";
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
            <div className="w-full group-data-[state=collapsed]:hidden items-center gap-4 justify-between flex my-1">
              <Link href={"/"} className="font-bold flex-1">
                <Button
                  variant="ghost"
                  className="rounded-full font-bold gap-0 px-2!"
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
