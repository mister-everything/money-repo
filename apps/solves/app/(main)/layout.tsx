import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/layouts/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { safeGetSession } from "@/lib/auth/server";

export default async function DashBoardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 세션 확인 및 개인정보 동의 여부 체크
  const session = await safeGetSession();

  // 로그인된 사용자인데 개인정보 동의가 안 된 경우 온보딩으로 리다이렉트
  if (session?.user && !(session.user as any).hasPrivacyConsent) {
    redirect("/about-you");
  }

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
