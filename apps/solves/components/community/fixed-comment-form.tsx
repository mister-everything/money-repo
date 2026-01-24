"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { CommentForm } from "./comment-form";

export function FixedCommentForm() {
  const { open, state } = useSidebar();
  const isExpanded = state === "expanded" && open;

  return (
    <div
      className="fixed bottom-8 z-50 transition-all duration-200"
      style={{
        left: isExpanded
          ? "calc(var(--sidebar-width, calc(var(--spacing) * 60)) + 1rem)"
          : "1rem",
        right: "1rem",
      }}
    >
      <div className="container max-w-7xl mx-auto">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shadow-lg p-3">
            <CommentForm />
          </div>
        </div>
      </div>
    </div>
  );
}
