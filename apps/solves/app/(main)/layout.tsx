import { cookies } from "next/headers";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { SIDEBAR_COOKIE_NAME, SidebarProvider } from "@/components/ui/sidebar";
import { AUTH_COOKIE_PREFIX } from "@/lib/const";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();

  const isDefaultOpen = !Boolean(
    cookieStore.get(`${AUTH_COOKIE_PREFIX}.session_token`),
  )
    ? false
    : Boolean(cookieStore.get(SIDEBAR_COOKIE_NAME)?.value === "true");
  return (
    <div>
      <SidebarProvider
        defaultOpen={isDefaultOpen}
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 60)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <main className="flex-1 overflow-hidden w-full h-screen p-2">
          <div className="@container/main border rounded-3xl h-full overflow-y-auto relative bg-card">
            <div className="">{children}</div>
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
