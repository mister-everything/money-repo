"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatPanel } from "./chat-panel";

interface ResizableChatPanelProps {
  messages?: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>;
  onSendMessage?: (message: string) => void;
}

const MIN_WIDTH = 280;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 450;
const COLLAPSED_WIDTH = 40;

export function ResizableChatPanel({
  messages,
  onSendMessage,
}: ResizableChatPanelProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;

      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
        setIsCollapsed(false);
      } else if (newWidth < MIN_WIDTH) {
        setIsCollapsed(true);
      }
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative border-l border-border bg-background transition-all duration-200",
        isCollapsed ? "shrink-0" : "",
      )}
      style={{
        width: isCollapsed ? COLLAPSED_WIDTH : width,
      }}
    >
      {/* Resize Handle */}
      <div
        className={cn(
          "absolute left-0 top-0 z-10 h-full w-1 cursor-col-resize hover:bg-primary/50",
          isDragging && "bg-primary",
          isCollapsed && "hidden",
        )}
        onMouseDown={handleMouseDown}
      />

      {/* Toggle Button */}
      <div
        className={cn(
          "absolute left-0 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2",
        )}
      >
        <Button
          size="icon"
          variant="outline"
          onClick={toggleCollapse}
          className="h-8 w-8 rounded-full bg-background shadow-md hover:shadow-lg"
        >
          {isCollapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      <div
        className={cn(
          "h-full overflow-hidden transition-opacity duration-200",
          isCollapsed ? "opacity-0" : "opacity-100",
        )}
      >
        {!isCollapsed && (
          <ChatPanel messages={messages} onSendMessage={onSendMessage} />
        )}
      </div>
    </div>
  );
}
