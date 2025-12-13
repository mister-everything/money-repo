"use client";

import {
  FolderTreeIcon,
  SquareChartGanttIcon,
  TrendingUpDownIcon,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarLink,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { NavItem } from "./nav-item";

const menuItems = [
  {
    title: "구독 상품",
    url: "/solves/plan",
    icon: SquareChartGanttIcon,
  },
  {
    title: "AI Model 관리",
    url: "/solves/ai-prices",
    icon: TrendingUpDownIcon,
  },
  {
    title: "카테고리 관리",
    url: "/solves/categories",
    icon: FolderTreeIcon,
  },
];

export function NavSolves() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>solves</SidebarGroupLabel>
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
