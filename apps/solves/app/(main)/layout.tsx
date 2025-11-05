import { AppSidebar } from "@/components/layouts/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashBoardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="@container/main">{children}</div>
        </main>
      </SidebarProvider>
    </div>
  );
}
