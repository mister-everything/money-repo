"use client";

import { generateUniqueNicknames } from "@workspace/util";
import { useCallback, useMemo, useReducer } from "react";
import { GradualSpacingText } from "../ui/gradual-spacing-text";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function SetupNickname({
  nickname = "",
  onChangeNickname,
  feedback,
}: {
  nickname?: string;
  onChangeNickname: (nickname: string) => void;
  feedback?: string | null;
}) {
  const [tick, nextTick] = useReducer((tick) => tick + 1, 0);

  const randomNickNames = useMemo(() => {
    return generateUniqueNicknames(20);
  }, [tick]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChangeNickname(e.currentTarget.value);
    },
    [onChangeNickname],
  );

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-2 justify-center items-center mb-2">
        <Label className="text-2xl font-semibold px-2 mb-2">
          <GradualSpacingText text="어떤 이름으로 활동 하시겠어요?" />
        </Label>

        <Tooltip open={!!feedback}>
          <TooltipTrigger asChild>
            <Input
              autoFocus
              className="fade-300 w-full font-semibold text-lg! text-center shadow-none border-none bg-secondary p-5 hover:bg-input focus:bg-secondary/80! focus:ring-0!"
              placeholder="닉네임"
              value={nickname}
              onChange={handleChange}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs text-muted-foreground">{feedback}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
