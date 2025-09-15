"use client";

import { useCallback } from "react";
import { notify } from "@/components/notify";
import { Button } from "@/components/ui/button";
export default function Page() {
  const handleClick = useCallback(() => {
    notify.alert({
      title: "제목",
      description: "내용",
      okText: "확인",
    });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="bg-blue-1000 text-2xl font-bold">Hello World</h1>
        <Button onClick={handleClick}>Click !!</Button>
      </div>
    </div>
  );
}
