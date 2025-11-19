"use client";

import { AlertTriangleIcon, ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({ error }: { error: Error }) {
  return (
    <div className="flex flex-col w-full gap-4 text-muted-foreground items-center justify-center h-screen">
      <AlertTriangleIcon className="size-10" />
      <h2 className="text-xl text-foreground">오류가 발생했습니다.</h2>
      <p className="text-sm">{error.message}</p>
      <Button variant="ghost">
        <ChevronLeftIcon />
        <Link href="/">홈으로 이동</Link>
      </Button>
    </div>
  );
}
