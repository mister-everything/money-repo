import { probService } from "@service/solves";
import Link from "next/link";

import { ChatDrawer } from "@/components/chat-interface/chat-drawer";
import { ProblemBook } from "@/components/problem/problem-book";
import { Button } from "@/components/ui/button";

export default async function ProblemBookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  console.log(params);

  const { id } = await params;

  const hasPermission = await probService.hasProbBookPermission(id, "1");

  const book = await probService.selectProbBookById(id);

  if (!hasPermission || !book)
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-destructive mb-4">잘못된 접근입니다.</div>
          <Link href="/prob">
            <Button variant="ghost">목록으로 이동</Button>
          </Link>
        </div>
      </div>
    );

  return (
    <div className="bg-background flex min-h-svh flex-col overflow-hidden">
      <div className="px-6 py-6 flex ">
        <Link href="/prob">
          <Button
            className="text-primary hover:text-primary/90 mr-auto"
            variant="ghost"
          >
            ← 문제집 목록으로 돌아가기
          </Button>
        </Link>
        <ChatDrawer />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <ProblemBook probBook={book} />
        </div>
      </div>
    </div>
  );
}
