"use client";

import { ChevronLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

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
      className={className}
    >
      {arrow && <ChevronLeftIcon className="size-4!" />}
      {children}
    </Button>
  );
}
