import { AlertTriangleIcon, ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col w-full gap-4 text-muted-foreground items-center justify-center h-screen">
      <AlertTriangleIcon className="size-10" />
      <h2 className="text-xl">찾을 수 없는 문제집입니다.</h2>
      <Button variant="ghost" asChild>
        <div>
          <ChevronLeftIcon />
          <Link href="/">홈으로 이동</Link>
        </div>
      </Button>
    </div>
  );
}
