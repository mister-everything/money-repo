import { LayoutGridIcon, MailIcon, ShieldCheckIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarLink,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { NavItem } from "./nav-item";

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
    title: "초대 관리",
    url: "/invitations",
    icon: MailIcon,
  },
];

export function NavMain() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarLink href={item.url} key={item.url}>
              <NavItem title={item.title} url={item.url}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </NavItem>
            </SidebarLink>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
