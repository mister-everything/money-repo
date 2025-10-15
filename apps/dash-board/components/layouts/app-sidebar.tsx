import {
  LayoutGridIcon,
  ShieldCheckIcon,
  TentTreeIcon,
  TestTube,
} from "lucide-react";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getUser } from "@/lib/auth/server";
import { NavItem } from "./nav-item";
import { NavUser } from "./nav-user";

const menuItems = [
  {
    title: "대시보드",
    url: "/",
    icon: LayoutGridIcon,
  },
  {
    title: "사용자 관리",
    url: "/users",
    icon: ShieldCheckIcon,
  },
  {
    title: "TEST화면",
    url: "/test-view",
    icon: TestTube,
  },
];

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const user = await getUser();
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/" className="p-2">
                <TentTreeIcon className="size-4" />
                <span className="text-base font-semibold">Money Repo</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <Link href={item.url} key={item.url}>
                  <NavItem title={item.title} url={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </NavItem>
                </Link>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
