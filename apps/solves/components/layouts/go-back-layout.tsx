import { cn } from "@/lib/utils";

import { GoBackButton } from "./go-back-button";

export function GoBackLayout({
  children,
  className,
  href,
  label,
  ...props
}: React.ComponentProps<"div"> & { href?: string; label?: string }) {
  return (
    <div className={cn("flex flex-col w-full relative", className)} {...props}>
      <header className="w-full flex gap-2 items-center px-4 py-3 sticky inset-0 z-10">
        <div
          className="absolute inset-0 -bottom-4 backdrop-blur-sm pointer-events-none"
          style={{
            maskImage:
              "linear-gradient(to bottom, black 40%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 40%, transparent 100%)",
          }}
        />
        <div className="relative z-10 flex gap-1 items-center w-full">
          <GoBackButton>{label}</GoBackButton>
        </div>
      </header>
      {children}
    </div>
  );
}
