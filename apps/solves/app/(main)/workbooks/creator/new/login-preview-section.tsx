"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
    <div className={cn("relative w-full h-full min-h-10", className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: [0, 1, 1, 0],
          scale: [0.95, 1, 1, 0.95],
        }}
        transition={{
          duration: 5,
          times: [0.2, 0.3, 0.8, 1],
          repeat: Number.POSITIVE_INFINITY,
          delay: delay,
          ease: "easeInOut",
        }}
        className="absolute inset-0 overflow-hidden flex flex-col gap-1.5 p-2 border border-secondary rounded-xl bg-secondary/10"
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
          duration: 5,
          times: [0, 0.15, 0.25, 1],
          repeat: Number.POSITIVE_INFINITY,
          delay: delay,
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0 border-2 border-primary/40 bg-primary/5 z-10 rounded-xl"
      />
    </div>
  );
}

function SkeletonBlockContent({ lines = 1 }: { lines?: number }) {
  return (
    <div className="space-y-1.5 w-full">
      <Skeleton className="h-2 w-3/4 bg-muted-foreground/20" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-1.5 w-full bg-muted-foreground/10" />
      ))}
    </div>
  );
}

export function LoginPreviewSection() {
  return (
    <Link
      href="/sign-in?callbackUrl=/workbooks/creator/new"
      className="flex items-center w-full justify-center gap-5 mt-4 py-14 px-8 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all group cursor-pointer"
    >
      {/* 왼쪽: 애니메이션 프리뷰 */}
      <div className="relative w-36 h-24 flex gap-2.5 shrink-0">
        <BuildingBlockPreview className="flex-1" delay={0}>
          <SkeletonBlockContent lines={3} />
        </BuildingBlockPreview>
        <div className="flex-[0.6] flex flex-col gap-2.5">
          <BuildingBlockPreview className="flex-1" delay={1.2}>
            <SkeletonBlockContent lines={1} />
          </BuildingBlockPreview>
          <BuildingBlockPreview className="flex-1" delay={2.4}>
            <SkeletonBlockContent lines={1} />
          </BuildingBlockPreview>
        </div>
      </div>

      {/* 가운데: 텍스트 */}
      <div className="text-left">
        <p className="text-lg font-semibold text-foreground">
          로그인하고 Solves AI와 함께 만들어요
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          AI와 함께 나만의 문제집을 쉽고 빠르게
        </p>
      </div>

      {/* 오른쪽: 화살표 */}
      <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
    </Link>
  );
}
