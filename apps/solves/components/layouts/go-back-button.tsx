"use client";

import { ChevronLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GoBackButton({
  className,
  children = "뒤로가기",
  href,
  arrow = true,
}: {
  className?: string;
  children?: React.ReactNode;
  arrow?: boolean;
  href?: string;
}) {
  const router = useRouter();

  const onBack = () => {
    if (href) router.push(href);

    if (window.history.length > 1) {
      return router.back();
    }
    router.replace("/workbooks");
  };

  return (
    <Button
      variant="ghost"
      size={children ? "default" : "icon"}
      onClick={onBack}
      className={cn("shadow-none", className)}
    >
      {arrow && <ChevronLeftIcon className="size-4!" />}
      {children}
    </Button>
  );
}
