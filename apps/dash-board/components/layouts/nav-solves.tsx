"use client";

import {
  FileTextIcon,
  FolderTreeIcon,
  MessageSquareWarningIcon,
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
    title: "소재 관리",
    url: "/solves/categories",
    icon: FolderTreeIcon,
  },
  {
    title: "정책 관리",
    url: "/solves/policies",
    icon: FileTextIcon,
  },
  {
    title: "신고 관리",
    url: "/solves/reports",
    icon: MessageSquareWarningIcon,
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
