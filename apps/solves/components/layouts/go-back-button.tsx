"use client";

import { ChevronLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function GoBackButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size={children ? "default" : "icon"}
      onClick={() => router.back()}
      className={className}
    >
      <ChevronLeftIcon className="size-4!" />
      {children}
    </Button>
  );
}
