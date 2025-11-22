import { probService } from "@service/solves";
import Link from "next/link";

import { ChatDrawer } from "@/components/chat-interface/chat-drawer";
import { GoBackButton } from "@/components/layouts/go-back-button";
import { ProblemBook } from "@/components/problem/problem-book";
import { Button } from "@/components/ui/button";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const book = await probService.selectProbBookById(id);

  if (!book)
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-destructive mb-4">잘못된 접근입니다.</div>
          <Link href="/">
            <Button variant="ghost">목록으로 이동</Button>
          </Link>
        </div>
      </div>
    );

  return (
    <div className="bg-background flex min-h-svh flex-col overflow-hidden">
      <div className="px-6 py-6 flex justify-between">
        <GoBackButton />
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
