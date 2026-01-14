"use client";

import { WorkBookWithoutBlocks } from "@service/solves/shared";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import Link from "next/link";
import { InDevelopment } from "../ui/in-development";
import { WorkbookCard } from "./workbook-card";

interface WorkbookCarouselProps {
  workBooks: WorkBookWithoutBlocks[];
}

export function WorkbookCarousel({ workBooks }: WorkbookCarouselProps) {
  // 빈 슬롯을 포함한 5개 배열 생성
  const displayItems = Array.from({ length: 5 }).map((_, index) => {
    const workBook = workBooks[index];
    return workBook || null;
  });

  // 무한 스크롤을 위해 배열을 2번 복제 (원본 + 복사본)
  const infiniteItems = [...displayItems, ...displayItems];

  const itemWidth = 312; // w-72(288px) + gap-6(24px)
  const totalWidth = displayItems.length * itemWidth;

  const xTranslate = useMotionValue<number>(0);

  // 부드러운 무한 스크롤 애니메이션
  useAnimationFrame((time, delta) => {
    const newX = xTranslate.get() - (delta / 1000) * 50;

    // 한 세트를 지나가면 리셋
    if (Math.abs(newX) >= totalWidth) {
      xTranslate.set(0);
    } else {
      xTranslate.set(newX);
    }
  });

  if (displayItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-52">
        <p className="text-muted-foreground">문제집이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden py-8">
      {/* 캐러셀 컨테이너 */}
      <div className="relative w-full overflow-hidden py-2 rounded-xl">
        <div className="absolute inset-0 bg-linear-to-r to-10% from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-linear-to-l to-10% from-background to-transparent z-10 pointer-events-none" />
        <motion.div
          className="flex gap-6"
          style={{
            x: xTranslate,
          }}
        >
          {infiniteItems.map((item, index) => (
            <div
              key={`${index}-${item?.id || "empty"}`}
              className="w-72 shrink-0"
            >
              {item ? (
                <Link href={`/workbooks/${item.id}/preview`}>
                  <WorkbookCard workBook={item} />
                </Link>
              ) : (
                <InDevelopment className="w-full h-44">
                  아직 없네요 🤔
                </InDevelopment>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
