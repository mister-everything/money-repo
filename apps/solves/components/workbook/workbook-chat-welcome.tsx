"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2Icon,
  ListRestartIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradualSpacingText } from "@/components/ui/gradual-spacing-text";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface WorkbookChatWelcomeProps {
  onSuggestClick: (prompt: string) => void;
}

const SUGGESTIONS = [
  {
    icon: <SearchIcon className="size-4 text-primary" />,
    label: "최신 정보로 검색해서 만들기",
    prompt:
      "현재 주제와 관련된 최신 정보를 웹에서 검색해서 문제집을 만들어줘. 필요한 정보가 있다면 나에게 질문해줘.",
  },
  {
    icon: <SparklesIcon className="size-4 text-primary" />,
    label: "Solves AI와 기획 시작하기",
    prompt:
      "Solves AI와 함께 새로운 문제집을 기획하고 싶어. 어떤 정보가 필요한지 물어봐줘.",
  },
  {
    icon: <CheckCircle2Icon className="size-4 text-primary" />,
    label: "OX 퀴즈 문제집 만들기",
    prompt: "이 주제로 OX 퀴즈로만 구성된 문제집을 만들어줘.",
  },
  {
    icon: <ListRestartIcon className="size-4 text-primary" />,
    label: "문제 검토 요청하기",
    prompt: "현재 작성된 문제들에 오류나 개선할 점이 있는지 검토해줘.",
  },
];

function BuildingBlockPreview({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative w-full h-full min-h-12", className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: [0, 1, 1, 0],
          scale: [0.95, 1, 1, 0.95],
        }}
        transition={{
          duration: 6,
          times: [0.2, 0.3, 0.8, 1],
          repeat: Number.POSITIVE_INFINITY,
          delay: delay,
          ease: "easeInOut",
        }}
        className="absolute inset-0 overflow-hidden flex flex-col gap-2 p-2 border border-secondary rounded-xl bg-secondary/10"
      >
        {children}
      </motion.div>
      <motion.div
        initial={{ width: 0, height: 0, opacity: 0 }}
        animate={{
          width: ["0%", "100%", "100%", "100%"],
          height: ["0%", "100%", "100%", "100%"],
          opacity: [0, 1, 0, 0],
        }}
        transition={{
          duration: 6,
          times: [0, 0.15, 0.25, 1],
          repeat: Number.POSITIVE_INFINITY,
          delay: delay,
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0 border-2 border-dashed border-primary/40 bg-primary/5 z-10 rounded-xl"
      />
    </div>
  );
}

function SkeletonBlockContent({ lines = 2 }: { lines?: number }) {
  return (
    <div className="space-y-1.5 w-full">
      <Skeleton className="h-2 w-3/4 bg-muted-foreground/20" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-1 w-full bg-muted-foreground/10" />
      ))}
    </div>
  );
}

export function WorkbookChatWelcome({
  onSuggestClick,
}: WorkbookChatWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-10 animate-in fade-in duration-500">
      <div className="space-y-8 w-full max-w-sm mx-auto">
        <div className="relative w-full h-32 flex gap-3">
          <BuildingBlockPreview className="flex-1" delay={0}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="size-3 rounded-full bg-muted-foreground/30" />
              <Skeleton className="h-2 w-12 bg-muted-foreground/20" />
            </div>
            <SkeletonBlockContent lines={3} />
          </BuildingBlockPreview>

          <div className="flex-[0.7] flex flex-col gap-3">
            <BuildingBlockPreview className="flex-1" delay={1.5}>
              <SkeletonBlockContent lines={1} />
            </BuildingBlockPreview>
            <BuildingBlockPreview className="flex-1" delay={3}>
              <SkeletonBlockContent lines={1} />
            </BuildingBlockPreview>
          </div>

          <div className="absolute inset-x-0 -bottom-4 h-12 bg-linear-to-t from-background via-background/80 to-transparent z-20" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight">
            <span className="logo-text">Solves</span>
            <span className="text-primary text-2xl mr-2">.</span>
            <GradualSpacingText text="와 함께 문제집을 완성해보세요" />
          </h2>
          <p className="text-muted-foreground text-xs leading-relaxed mx-auto fade-2000">
            AI와 함께 쉽고 빠르게
            <br />
            나만의 문제집을 완성해보세요.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
        {SUGGESTIONS.map((suggestion, index) => (
          <motion.div
            key={suggestion.label}
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 + index * 0.05 }}
          >
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full px-4 bg-secondary/40"
              onClick={() => onSuggestClick(suggestion.prompt)}
            >
              {suggestion.icon}
              <span className="text-xs font-medium">{suggestion.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
