import { AppSidebar } from "@/components/layouts/app-sidebar";
import { MainContainer } from "@/components/layouts/main-container";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <SidebarProvider
        defaultOpen
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 60)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <MainContainer>{children}</MainContainer>
      </SidebarProvider>
    </div>
  );
}
