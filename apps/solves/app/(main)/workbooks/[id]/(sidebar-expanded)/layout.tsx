import { SidebarController } from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarController openMounted={false} openUnmounted={true}>
      {children}
    </SidebarController>
  );
}
