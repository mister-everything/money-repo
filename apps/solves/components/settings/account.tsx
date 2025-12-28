"use client";

import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { authClient } from "@/lib/auth/client";
import { Step } from "../onboarding/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { GradualSpacingText } from "../ui/gradual-spacing-text";
import { notify } from "../ui/notify";

export function Account() {
  const { data: session, isPending } = authClient.useSession();

  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    const answer = await notify.confirm({
      title: "로그아웃",
      description: "로그아웃하시겠습니까?",
      okText: "로그아웃",
      cancelText: "취소",
    });
    if (answer) {
      authClient.signOut().finally(() => {
        router.push("/sign-in");
      });
    }
  }, [router]);

  const handleEditProfile = useCallback(() => {
    const steps: string[] = [Step.NICKNAME, Step.IMAGE];
    router.push(`/about-you?steps=${steps.join(",")}`);
  }, [router]);

  const handleDeleteUser = useCallback(async () => {
    notify.alert({
      title: "계정 삭제 불가",
      description:
        "계정 삭제 정책 미확정으로 neo.cgoing@gmail.com 으로 문의해주세요.",
      okText: "확인",
    });
  }, []);

  if (!session && !isPending) {
    return (
      <div className="text-center text-sm text-muted-foreground py-12">
        로그인이 필요합니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="w-full h-full fade-1000 flex flex-col gap-4 my-14 items-center justify-center">
        <Avatar className="gentle-bounce size-24 flex items-center overflow-visible justify-center bg-secondary relative">
          <Avatar className="absolute size-24 flex items-center fade-5000 justify-center bg-secondary blur-3xl -z-10">
            <AvatarImage
              src={session?.user.image ?? ""}
              fetchPriority="low"
              alt={`${session?.user.nickname} 프로필 이미지`}
              className="object-cover size-16 rounded-full"
            />
          </Avatar>
          <AvatarImage
            fetchPriority="high"
            src={session?.user.image ?? ""}
            alt={`${session?.user.nickname} 프로필 이미지`}
            className="object-cover size-16 rounded-full"
          />
          <AvatarFallback className="text-4xl">
            {session?.user.nickname?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>

        <p className="flex items-center text-2xl font-semibold">
          {session?.user.nickname ?? ""}
        </p>
        {session?.user && (
          <div className="text-xs text-muted-foreground">
            <GradualSpacingText
              text={`가입한지 ${formatDistanceToNow(session.user.createdAt, { locale: ko })} 이 되었습니다.`}
            />
          </div>
        )}
      </div>
      <div className="w-full gap-2 flex justify-end items-center">
        <Button
          variant="secondary"
          className="text-muted-foreground"
          onClick={handleEditProfile}
        >
          프로필 변경
        </Button>
        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={handleSignOut}
        >
          로그아웃
        </Button>
      </div>

      <div className="flex items-center justify-between border-t pt-2 mt-2">
        <span className="text-sm text-muted-foreground">계정 삭제하기</span>
        <Button
          className="rounded-full hover:bg-destructive hover:text-background text-muted-foreground"
          variant="ghost"
          onClick={handleDeleteUser}
        >
          삭제
        </Button>
      </div>
    </div>
  );
}
