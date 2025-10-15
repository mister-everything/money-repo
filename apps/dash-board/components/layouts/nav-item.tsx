"use client";

import { usePathname } from "next/navigation";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";

export function NavItem({
  title,
  url,
  children,
}: {
  title: string;
  url: string;
  children: React.ReactNode;
}) {
  const path = usePathname();

  const isActive = path === url;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={title} isActive={isActive}>
        {children}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
