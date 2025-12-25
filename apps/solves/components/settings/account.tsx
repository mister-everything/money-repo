"use client";

import { generateUniqueNicknames } from "@workspace/util";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { CameraIcon, SmileIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";
import { updateProfileAction } from "@/actions/user";
import { authClient } from "@/lib/auth/client";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { notify } from "../ui/notify";

export function Account() {
  const { resolvedTheme } = useTheme();
  const { data: session, refetch } = authClient.useSession();

  const [state, setState] = useState({
    nickname: "",
    image: "",
  });

  const [, update, isUpdating] = useSafeAction(updateProfileAction, {
    failMessage: "프로필 정보 업데이트에 실패했습니다.",
    onSuccess: () => {
      refetch();
    },
  });

  const handleDeleteUser = useCallback(async () => {
    notify.alert({
      title: "계정 삭제 불가",
      description:
        "계정 삭제 정책 미확정으로 neo.cgoing@gmail.com 으로 문의해주세요.",
      okText: "확인",
    });
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    setState({
      ...state,
      image: emoji,
    });
  };

  const isDiff = useMemo(() => {
    return (
      (state.nickname || "") !== (session?.user.nickname || "") ||
      (state.image || "") !== (session?.user.image || "")
    );
  }, [
    state.nickname,
    state.image,
    session?.user.nickname,
    session?.user.image,
  ]);

  const randomNickNames = useMemo(() => {
    if (Boolean(state.nickname)) return [];
    return generateUniqueNicknames(3);
  }, [Boolean(state.nickname)]);

  useEffect(() => {
    if (session) {
      setState({
        nickname: session.user.nickname || "",
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
      <div className="w-full h-full flex mt-14 items-center justify-center">
        <div className="relative">
          <Avatar className="size-24 border">
            <AvatarImage src={state.image} alt={state.nickname} />
            <AvatarFallback>{state.nickname.charAt(0)}</AvatarFallback>
          </Avatar>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-0 right-0 rounded-full shadow-none bg-input"
              >
                <CameraIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <SmileIcon className="mr-2 size-4 text-muted-foreground" />
                  <span className="mr-4">이모지 선택</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <EmojiPicker
                    lazyLoadEmojis
                    open
                    className="fade-300"
                    theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
                    onEmojiClick={(emoji) => handleEmojiSelect(emoji.imageUrl)}
                  />
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="text-muted-foreground text-xs" htmlFor="nickname">
            닉네임
          </Label>
          <Input
            id="nickname"
            value={state.nickname}
            onChange={(e) => setState({ ...state, nickname: e.target.value })}
            placeholder="닉네임을 입력하세요"
          />
          {randomNickNames.length > 0 && (
            <div className="flex flex-col gap-1 my-2">
              <span className="text-muted-foreground text-xs mt-2">
                이런 닉네임도 있어요!
              </span>
              <div className="text-muted-foreground flex fade-300 gap-1 items-center text-xs">
                {randomNickNames.map((nickname) => (
                  <Button
                    key={nickname}
                    onClick={() => setState({ ...state, nickname: nickname })}
                    variant="secondary"
                    size="sm"
                    className="text-xs bg-input"
                  >
                    {nickname}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Button
        onClick={() => update(state)}
        disabled={isUpdating || !isDiff || !state.nickname}
        size={"sm"}
      >
        프로필 정보 저장
      </Button>

      <div className="flex items-center justify-between border-t pt-2 mt-2">
        <span>계정 삭제하기</span>
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
