"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  children: (threadId: string) => React.ReactNode;
}

export function WorkbookEditChatTabs({
  threads,
  currentThreadId,
  onThreadChange,
  onNewChat,
  children,
}: WorkbookEditChatTabsProps) {
  return (
    <div className="flex flex-col h-full">
      <Tabs
        value={currentThreadId || "new"}
        onValueChange={(value) => {
          if (value === "new") {
            onNewChat();
          } else {
            onThreadChange(value);
          }
        }}
        className="flex flex-col h-full"
      >
        <div className="flex items-center gap-2 px-2 py-2 border-b">
          <TabsList className="flex-1 justify-start overflow-x-auto">
            {threads.map((thread) => (
              <TabsTrigger
                key={thread.id}
                value={thread.id}
                className={cn(
                  "max-w-[200px] truncate",
                  thread.title || "New Chat",
                )}
              >
                {thread.title || "New Chat"}
              </TabsTrigger>
            ))}
            {currentThreadId &&
              !threads.find((t) => t.id === currentThreadId) && (
                <TabsTrigger
                  value={currentThreadId}
                  className="max-w-[200px] truncate"
                >
                  New Chat
                </TabsTrigger>
              )}
          </TabsList>
          <Button
            size="icon"
            variant="ghost"
            onClick={onNewChat}
            className="shrink-0"
          >
            <PlusIcon className="size-4" />
          </Button>
        </div>
        {threads.map((thread) => (
          <TabsContent
            key={thread.id}
            value={thread.id}
            className="flex-1 m-0 mt-0"
          >
            {children(thread.id)}
          </TabsContent>
        ))}
        {currentThreadId && !threads.find((t) => t.id === currentThreadId) && (
          <TabsContent value={currentThreadId} className="flex-1 m-0 mt-0">
            {children(currentThreadId)}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
