"use client";

import { generateUniqueNicknames } from "@workspace/util";
import { AnimatePresence, motion } from "framer-motion";
import { Shuffle } from "lucide-react";
import { useCallback, useMemo, useReducer, useState } from "react";
import { useMounted } from "@/hooks/use-mounted";
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
  const [isShuffling, setIsShuffling] = useState(false);
  const mounted = useMounted();

  const randomNickNames = useMemo(() => {
    return generateUniqueNicknames(12);
  }, [tick]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChangeNickname(e.currentTarget.value);
    },
    [onChangeNickname],
  );

  const handleSelectNickname = useCallback(
    (selectedNickname: string) => {
      onChangeNickname(selectedNickname);
    },
    [onChangeNickname],
  );

  const handleShuffle = useCallback(() => {
    setIsShuffling(true);
    setTimeout(() => {
      nextTick();
      setIsShuffling(false);
    }, 300);
  }, []);

  return (
    <div className="flex flex-col gap-6 items-center w-full max-w-2xl">
      {/* Title */}
      <div className="flex flex-col gap-2 justify-center items-center">
        <Label className="text-2xl font-semibold px-2">
          <GradualSpacingText text="어떤 이름으로 활동 하시겠어요?" />
        </Label>
      </div>

      <div className="relative w-full h-64 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!isShuffling && mounted && (
            <motion.div
              key={tick}
              className="relative w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {randomNickNames.map((name, index) => (
                <NicknameChip
                  key={`${tick}-${name}`}
                  nickname={name}
                  index={index}
                  onSelect={handleSelectNickname}
                  isSelected={nickname === name}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shuffle Button */}
        <motion.button
          type="button"
          onClick={handleShuffle}
          disabled={isShuffling}
          className="absolute bottom-2 right-2 p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="새로운 닉네임 추천받기"
        >
          <motion.div
            animate={isShuffling ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Shuffle className="size-4" />
          </motion.div>
        </motion.button>
      </div>

      <div className="w-full max-w-sm">
        <Tooltip open={!!feedback}>
          <TooltipTrigger asChild>
            <div className="relative">
              <Input
                autoFocus
                className="w-full font-semibold text-lg! text-center shadow-none border-none bg-secondary p-5 hover:bg-input focus:bg-secondary/80! focus:ring-0! transition-all"
                placeholder="직접 입력"
                value={nickname}
                onChange={handleChange}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs text-muted-foreground">{feedback}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

// Predefined positions for nickname chips in a cloud-like layout
const CHIP_POSITIONS = [
  { x: -120, y: -80, rotate: -8, scale: 0.95 },
  { x: 80, y: -90, rotate: 5, scale: 1.0 },
  { x: -180, y: -20, rotate: -3, scale: 0.9 },
  { x: 160, y: -30, rotate: 8, scale: 0.92 },
  { x: -140, y: 50, rotate: -5, scale: 0.88 },
  { x: 120, y: 40, rotate: 6, scale: 0.95 },
  { x: -60, y: -110, rotate: 3, scale: 0.85 },
  { x: 200, y: 20, rotate: -4, scale: 0.9 },
  { x: -200, y: 30, rotate: 7, scale: 0.87 },
  { x: 40, y: 70, rotate: -6, scale: 0.93 },
  { x: -80, y: 80, rotate: 4, scale: 0.9 },
  { x: 180, y: -70, rotate: -2, scale: 0.88 },
];

function NicknameChip({
  nickname,
  index,
  onSelect,
  isSelected,
}: {
  nickname: string;
  index: number;
  onSelect: (nickname: string) => void;
  isSelected: boolean;
}) {
  const position = CHIP_POSITIONS[index % CHIP_POSITIONS.length];

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{ x: "-50%", y: "-50%" }}
      initial={{
        opacity: 0,
        scale: 0,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        scale: 0,
        transition: { duration: 0.2 },
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: index * 0.05,
      }}
    >
      <motion.button
        type="button"
        onClick={() => onSelect(nickname)}
        className={`
          px-3 py-1.5 rounded-full text-sm font-medium
          cursor-pointer select-none whitespace-nowrap
          transition-colors duration-200
          ${
            isSelected
              ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/50"
              : "bg-secondary/80 text-secondary-foreground hover:bg-secondary"
          }
          backdrop-blur-sm border border-border/50
        `}
        animate={{
          x: position.x,
          y: position.y,
          scale: isSelected ? 1.1 : position.scale,
          rotate: position.rotate,
        }}
        whileHover={{
          scale: isSelected ? 1.15 : position.scale * 1.15,
          rotate: 0,
          transition: { duration: 0.2 },
        }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          animate={{
            y: [0, -2, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: index * 0.1,
            ease: "easeInOut",
          }}
          className="inline-block"
        >
          {nickname}
        </motion.span>
      </motion.button>
    </motion.div>
  );
}
