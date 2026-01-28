"use client";

import { ChevronLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

function isSameOriginReferrer() {
  if (typeof document === "undefined") return false;
  const ref = document.referrer;
  if (!ref) return false;

  try {
    return new URL(ref).origin === window.location.origin;
  } catch {
    return false;
  }
}

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
    const canBack =
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      isSameOriginReferrer();

    if (canBack) router.back();
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
