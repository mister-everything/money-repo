import { SidebarController } from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full">
      <SidebarController openMounted={false} openUnmounted={true} />
      {children}
    </div>
  );
}
