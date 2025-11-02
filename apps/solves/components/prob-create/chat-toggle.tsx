"use client";

import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function ChatToggle({ isOpen, onToggle, className }: ChatToggleProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggle}
      className={cn(
        "fixed top-20 right-4 z-50 rounded-full shadow-lg",
        className,
      )}
    >
      <MessageSquare className="h-4 w-4" />
    </Button>
  );
}
