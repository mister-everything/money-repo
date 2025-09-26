import { Home, PersonStanding, TestTube, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { getUser } from "@/lib/auth/server";

const menuItems = [
  {
    title: "대시보드",
    url: "/",
    icon: Home,
  },
  {
    title: "유저",
    url: "/users",
    icon: PersonStanding,
  },
  {
    title: "TEST화면",
    url: "/test-view",
    icon: TestTube,
  },
];

export async function AppSidebar() {
  const user = await getUser();
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-4 px-4 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <PersonStanding className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-3xl font-semibold">Money Repo</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    className="text-xl py-4 px-4 h-14"
                  >
                    <a href={item.url} className="flex items-center gap-4">
                      <item.icon className="h-6 w-6" />
                      <span className="text-xl font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-sidebar-accent transition-colors">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image ?? ""} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-red-500 text-white">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-medium truncate">{user.name}</p>
            <p className="text-base text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
