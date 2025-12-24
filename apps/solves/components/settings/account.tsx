"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

export function Account() {
  const { data: session } = authClient.useSession();

  const [state, setState] = useState({
    nickname: "",
    image: "",
  });

  useEffect(() => {
    if (session) {
      console.log({ session });
      setState({
        nickname: session.user.nickname || session.user.name || "",
        image: session.user?.image ?? "",
      });
    }
  }, [session]);

  if (!session) {
    return (
      <div className="text-center text-sm text-muted-foreground py-12">
        로그인이 필요합니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="w-full flex flex-col items-center justify-center h-full my-4">
        <Avatar className="size-24 border">
          <AvatarImage src={state.image} alt={state.nickname} />
          <AvatarFallback>{state.nickname.charAt(0)}</AvatarFallback>
        </Avatar>
        <p className="text-xl font-medium py-2">{state.nickname}</p>
      </div>
      <div className="flex items-center justify-between">
        <span>계정 삭제하기</span>
        <Button
          className="rounded-full hover:bg-destructive hover:text-background text-muted-foreground"
          variant="ghost"
        >
          삭제
        </Button>
      </div>
    </div>
  );
}
