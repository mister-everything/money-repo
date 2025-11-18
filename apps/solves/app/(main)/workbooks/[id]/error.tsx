"use client";

import { AlertTriangleIcon, ChevronLeftIcon, Link } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProbEditError({ error }: { error: Error }) {
  return (
    <div className="flex flex-col w-full gap-4 text-muted-foreground items-center justify-center h-screen">
      <AlertTriangleIcon className="size-10" />
      <h2 className="text-xl">문제집 조회 중 오류가 발생했습니다.</h2>
      <Button variant="ghost" asChild>
        <div>
          <ChevronLeftIcon />
          <Link href="/">홈으로 이동</Link>
        </div>
      </Button>
    </div>
  );
}
