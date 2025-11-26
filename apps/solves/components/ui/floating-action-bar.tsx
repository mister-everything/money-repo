import { cn } from "@/lib/utils";

interface FloatingActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export function FloatingActionBar({
  children,
  className,
}: FloatingActionBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-background/80 backdrop-blur-sm border rounded-full px-4 py-2 shadow-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FloatingActionBarDivider() {
  return <div className="w-px h-6 bg-border" />;
}
