"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

interface ProbHeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

export function ProbHeader({
  showBackButton = false,
  onBack,
}: ProbHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">Money Repo</span>
          </Link>
          {showBackButton && onBack && (
            <>
              <div className="h-6 w-px bg-border" />
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                처음으로 돌아가기
              </Button>
            </>
          )}
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
