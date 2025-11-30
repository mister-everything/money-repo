"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ChatThread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkbookEditChatTabsProps {
  threads: ChatThread[];
  currentThreadId?: string;
  onThreadChange: (threadId: string) => void;
  onNewChat: () => void;
}

export function WorkbookEditChatTabs({
  threads,
  currentThreadId,
  onThreadChange,
  onNewChat,
}: WorkbookEditChatTabsProps) {
  const hasThreads = threads.length > 0;
  const activeThreadId = currentThreadId ?? (hasThreads ? threads[0].id : "");

  const showTemporaryTab =
    !!currentThreadId &&
    !threads.some((thread) => thread.id === currentThreadId);

  return (
    <div className="flex w-full items-center gap-2">
      <Tabs
        value={activeThreadId}
        onValueChange={onThreadChange}
        className="w-full"
      >
        <ScrollArea className="w-full">
          <TabsList className="flex w-full items-center gap-2 bg-transparent p-0">
            {/* 채팅 리스트 모두 표출 */}
            {threads.map((thread) => (
              <TabsTrigger
                key={thread.id}
                value={thread.id}
                className={cn(
                  "flex h-9 min-w-[120px] items-center rounded-full border border-transparent bg-muted/60 px-3 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground",
                )}
              >
                <span className="truncate">
                  {thread.title?.trim() || "New Chat"}
                </span>
              </TabsTrigger>
            ))}
            {showTemporaryTab && currentThreadId && (
              <TabsTrigger
                value={currentThreadId}
                className="flex h-9 min-w-[120px] items-center rounded-full border border-dashed border-border/70 bg-muted/30 px-3 text-sm font-medium text-muted-foreground"
              >
                New Chat
              </TabsTrigger>
            )}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Tabs>
      <Tooltip>
        <TooltipTrigger>
          <Button
            size="icon"
            variant="ghost"
            onClick={onNewChat}
            className="shrink-0"
          >
            <PlusIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>New Chat</TooltipContent>
      </Tooltip>
    </div>
  );
}
