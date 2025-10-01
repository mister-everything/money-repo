"use client";

import { useParams, useRouter } from "next/navigation";
import { ChatDrawer } from "@/components/ChatInterface/chat-drawer";
import { ProblemBook } from "@/components/problem/problem-book";
import { Button } from "@/components/ui/button";
import { useBook } from "@/lib/swr/books";

export default function ProblemBookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = (params as { bookId?: string })?.bookId;
  const { book, isLoading, isError } = useBook(bookId);

  if (!bookId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-destructive mb-4">잘못된 접근입니다.</div>
          <Button variant="ghost" onClick={() => router.push("/problem")}>
            목록으로 이동
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6 text-muted-foreground">
          불러오는 중…
        </div>
      </div>
    );
  }

  if (isError || !book) {
    return (
      <div className="bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <Button variant="ghost" onClick={() => router.push("/problem")}>
            ← 문제집 목록으로 돌아가기
          </Button>
          <div className="mt-6 text-destructive">
            문제집을 불러오지 못했어요.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-svh flex-col overflow-hidden">
      <div className="px-6 py-6 flex ">
        <Button
          className="text-primary hover:text-primary/90 mr-auto"
          variant="ghost"
          onClick={() => router.push("/problem")}
        >
          ← 문제집 목록으로 돌아가기
        </Button>
        <ChatDrawer />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <ProblemBook probBook={book} />
        </div>
      </div>

      {/* <MessageDock theme="dark" /> */}
      {/* <FloatingAiAssistant />; */}
    </div>
  );
}
