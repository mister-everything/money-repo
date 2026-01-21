"use client";

import {
  ArrowUpRight,
  BookOpenCheck,
  LibraryIcon,
  MessageSquare,
  Pencil,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createCommunityCommentAction } from "@/actions/community";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { NavUser } from "./nav-user";

export function AppSidebar() {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [content, setContent] = useState("");

  const [, createComment, isPending] = useSafeAction(
    createCommunityCommentAction,
    {
      successMessage: "댓글이 작성되었어요.",
      failMessage: (error) => error.message || "댓글 작성에 실패했어요.",
      onSuccess: () => {
        setContent("");
        setIsHovered(false);
        router.push("/community");
        router.refresh();
      },
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!content.trim() || isPending) return;
    createComment({ content: content.trim() });
  };

  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarRail />
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="w-full group-data-[state=collapsed]:hidden items-center gap-4 justify-between flex my-1">
              <Link href={"/"} className="font-bold flex-1">
                <Button
                  variant="ghost"
                  className="rounded-full font-bold gap-0 px-2! logo-text"
                >
                  Solves
                  <span className="text-lg text-primary">.</span>
                </Button>
              </Link>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>풀기</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/workbooks"}>
                <Link href="/workbooks" onClick={() => setOpenMobile(false)}>
                  <LibraryIcon />
                  <span>문제 풀기</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/workbooks/session"}
              >
                <Link
                  href="/workbooks/session"
                  onClick={() => setOpenMobile(false)}
                >
                  <BookOpenCheck />
                  <span>내가 푼 문제집</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>만들기</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/workbooks/creator/new"}
              >
                <Link
                  href="/workbooks/creator/new"
                  onClick={() => setOpenMobile(false)}
                >
                  <Plus />
                  <span>문제 생성</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/workbooks/creator"}
              >
                <Link
                  href="/workbooks/creator"
                  onClick={() => setOpenMobile(false)}
                >
                  <Pencil />
                  <span>내가 만든 문제집</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex flex-col items-stretch space-y-4 px-2 pb-2">
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "group relative overflow-visible rounded-xl border bg-card transition-all duration-300",
            isHovered ? "border-primary/50" : "hover:border-primary/50",
          )}
        >
          <Link
            href="/community"
            onClick={() => setOpenMobile(false)}
            className="relative flex flex-col gap-2 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <AnimatedShinyText
                  shimmerWidth={120}
                  className={cn("font-bold text-foreground", "mx-0 max-w-none")}
                >
                  Small Talk
                </AnimatedShinyText>
                <p className="text-xs text-muted-foreground">
                  서비스에 대한 의견 또는 자유로운 이야기를 나눠보세요
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-foreground/70 group-hover:text-foreground transition-colors">
                <ArrowUpRight className="size-4" />
              </div>
            </div>
          </Link>

          {/* 입력창이 위로 튀어나오는 효과 */}
          <div
            className={cn(
              "absolute bottom-full left-0 right-0 mb-2 rounded-xl border bg-card p-4 shadow-lg transition-all duration-300 ease-out",
              isHovered
                ? "translate-y-0 opacity-100 pointer-events-auto"
                : "translate-y-2 opacity-0 pointer-events-none",
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit} className="space-y-3">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="오늘의 한마디를 남겨보세요..."
                maxLength={280}
                rows={3}
                disabled={isPending}
                autoFocus={isHovered}
                className="resize-none"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {content.length}/280
                </span>
                <Button
                  type="submit"
                  disabled={!content.trim() || isPending}
                  size="sm"
                >
                  {isPending ? "작성 중..." : "작성하기"}
                </Button>
              </div>
            </form>
          </div>
        </div>
        <SidebarMenu>
          <NavUser />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
