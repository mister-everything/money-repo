"use client";

import EmojiPicker, { Theme } from "emoji-picker-react";
import { ImageIcon, SmileIcon, SparklesIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { GradualSpacingText } from "../ui/gradual-spacing-text";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export function SetupImage({
  image,
  nickname = "",
  onChangeImage,
}: {
  image?: string;
  nickname?: string;
  onChangeImage: (image: string) => void;
}) {
  const { resolvedTheme } = useTheme();
  const [openEmojiPicker, setOpenEmojiPicker] = useState(false);
  const [openEmojiPickerMobile, setOpenEmojiPickerMobile] = useState(false);
  return (
    <div className="flex flex-col gap-4 justify-center items-center fade-1000">
      <Avatar className="gentle-bounce size-24 flex items-center justify-center bg-secondary overflow-visible relative">
        <Avatar className="absolute size-24 flex items-center fade-5000 justify-center bg-secondary blur-2xl -z-10">
          <AvatarImage
            src={image ?? ""}
            fetchPriority="low"
            alt={`${nickname} 프로필 이미지`}
            className="object-cover size-16 rounded-full"
          />
        </Avatar>
        <AvatarImage
          fetchPriority="high"
          src={image}
          alt={`${nickname} 프로필 이미지`}
          className="object-cover size-16 rounded-full"
        />
        <AvatarFallback className="text-4xl">
          {nickname?.charAt(0) || "?"}
        </AvatarFallback>
      </Avatar>
      <Label className="text-2xl font-semibold px-2">
        <GradualSpacingText text="프로필 이미지를 선택해주세요." />
      </Label>
      <div className="hidden sm:flex gap-2 text-xs text-muted-foreground fade-1000">
        <Popover open={openEmojiPicker} onOpenChange={setOpenEmojiPicker}>
          <PopoverTrigger>
            <div className="hover:bg-primary/5 hover:text-primary hover:border-primary gap-3 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center size-36 rounded-3xl border">
              <SmileIcon className="size-6" />
              이모지 선택
            </div>
          </PopoverTrigger>
          <PopoverContent className="p-0! border-none!" side="left">
            <EmojiPicker
              lazyLoadEmojis
              className="fade-300"
              theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
              onEmojiClick={(emoji) => {
                onChangeImage(emoji.imageUrl ?? "");
                setOpenEmojiPicker(false);
              }}
            />
          </PopoverContent>
        </Popover>
        <div
          onClick={() => toast.info("곧 추가될 기능입니다.")}
          className="bg-secondary gap-3 transition-all duration-300 flex flex-col items-center justify-center size-36 rounded-3xl"
        >
          <SparklesIcon className="size-6" />
          AI 로 생성
        </div>
        <div
          onClick={() => toast.info("곧 추가될 기능입니다.")}
          className="bg-secondary gap-3 transition-all duration-300 flex flex-col items-center justify-center size-36 rounded-3xl"
        >
          <ImageIcon className="size-6" />
          이미지 업로드
        </div>
      </div>
      <div className="flex sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="w-full">
              프로필 선택하기
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setOpenEmojiPickerMobile(true)}>
              <SmileIcon className="mr-2 size-4 text-muted-foreground" />
              <span className="mr-4">이모지 선택</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toast.info("곧 추가될 기능입니다.")}
            >
              <SparklesIcon className="mr-2 size-4 text-muted-foreground" />
              <span className="mr-4">AI 로 생성</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toast.info("곧 추가될 기능입니다.")}
            >
              <ImageIcon className="mr-2 size-4 text-muted-foreground" />
              <span className="mr-4">이미지 업로드</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Dialog
        open={openEmojiPickerMobile}
        onOpenChange={setOpenEmojiPickerMobile}
      >
        <DialogContent className="p-0! border-none!" showCloseButton={false}>
          <DialogTitle className="sr-only">이모지 선택</DialogTitle>
          <EmojiPicker
            lazyLoadEmojis
            open
            className="fade-300"
            theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
            onEmojiClick={(emoji) => {
              onChangeImage(emoji.imageUrl ?? "");
              setOpenEmojiPickerMobile(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
