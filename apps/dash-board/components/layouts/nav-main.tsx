import { LayoutGridIcon, ShieldCheckIcon, TestTube } from "lucide-react";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
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
    title: "TEST화면",
    url: "/test-view",
    icon: TestTube,
  },
];

export function NavMain() {
  return (
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
  );
}
