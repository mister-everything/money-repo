"use client";

import { SquareChartGanttIcon } from "lucide-react";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { NavItem } from "./nav-item";

const menuItems = [
  {
    title: "구독 상품",
    url: "/solves/plan",
    icon: SquareChartGanttIcon,
  },
];

export function NavSolves() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>solves</SidebarGroupLabel>
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
