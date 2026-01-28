"use client";

import { ChevronLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function GoBackButton({
  className,
  children,
  href,
  arrow = true,
}: {
  className?: string;
  children?: React.ReactNode;
  arrow?: boolean;
  href?: string;
}) {
  const router = useRouter();

  const isMobile = useIsMobile();

  const onBack = () => {
    if (href) router.push(href);
    else if (window.history.length > 1) router.back();
    else router.replace("/");
  };

  return (
    <Button
      variant={isMobile ? "secondary" : "ghost"}
      size={children ? "default" : "icon"}
      onClick={onBack}
      className={cn(
        "shadow-none backdrop-blur-md",
        isMobile && "bg-input",
        className,
      )}
    >
      {arrow && <ChevronLeftIcon className="size-4!" />}
      {children}
    </Button>
  );
}
