import { AppSidebar } from "@/components/layouts/app-sidebar";
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
        <main className="flex-1 overflow-hidden w-full h-full p-2">
          <div className="@container/main border rounded-3xl h-full overflow-y-auto relative bg-secondary dark:bg-card/40">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
