"use client";

import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeIcon } from "./ui/custom-icon";

interface ThemeToggleProps {
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

export function ThemeToggle({
  className,
  variant = "ghost",
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
      variant={variant}
      size="icon"
      className={cn(className)}
    >
      <ThemeIcon />
    </Button>
  );
}
