"use client";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
} from "framer-motion";
import { XIcon } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Array<{
    text: string;
    image: string;
    name: string;
    role: string;
    commentId?: string;
    userId?: string;
  }>;
  duration?: number;
  currentUserId?: string;
  onDelete?: (commentId: string) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const y = useMotionValue(0);
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentYRef = useRef(0);

  // y 값 변경 추적
  useMotionValueEvent(y, "change", (latest) => {
    currentYRef.current = latest;
  });

  // 애니메이션 시작 함수
  const startAnimation = useCallback(
    (fromY: number) => {
      if (!containerRef.current) return;

      // 기존 애니메이션 중지
      if (animationRef.current) {
        animationRef.current.stop();
      }

      const containerHeight = containerRef.current.scrollHeight;
      const halfHeight = containerHeight / 2;

      // 픽셀 단위로 이동 (속도 일정하게 유지)
      const pixelsPerSecond = props.duration ? halfHeight / props.duration : 50;

      // y 값 정규화: -halfHeight 이하이면 0으로 리셋
      let normalizedFromY = fromY;
      if (fromY <= -halfHeight + 1) {
        normalizedFromY = 0;
      }

      // 현재 위치에서 -halfHeight까지 남은 거리 계산
      const remainingDistance = Math.abs(-halfHeight - normalizedFromY);

      // 남은 거리가 너무 작으면 0에서 시작
      if (remainingDistance < 10) {
        normalizedFromY = 0;
      }

      const finalDistance = Math.abs(-halfHeight - normalizedFromY);
      const calculatedDuration = finalDistance / pixelsPerSecond;

      y.set(normalizedFromY);

      // onComplete로 직접 반복 구현
      animationRef.current = animate(y, -halfHeight, {
        duration: calculatedDuration,
        ease: "linear",
        onComplete: () => {
          // 애니메이션 완료 시 0에서 다시 시작
          if (animationRef.current) {
            startAnimation(0);
          }
        },
      });
    },
    [props.duration, y],
  );

  // 초기 애니메이션 시작 및 아이템 개수 변경 시 재시작
  useEffect(() => {
    if (!isHovered && containerRef.current) {
      requestAnimationFrame(() => {
        startAnimation(0);
      });
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [props.testimonials.length, startAnimation]);

  useEffect(() => {
    if (isHovered) {
      // hover 시 애니메이션 일시정지 (현재 위치 유지)
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    } else {
      // hover 해제 시 애니메이션 재개 (현재 위치에서 계속)
      if (!animationRef.current) {
        startAnimation(currentYRef.current);
      }
    }
  }, [isHovered, startAnimation]);

  return (
    <div
      className={props.className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        ref={containerRef}
        style={{ y }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[
          ...new Array(4).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(
                ({ text, image, name, role, commentId, userId }, i) => {
                  const isMyComment =
                    props.currentUserId && userId === props.currentUserId;
                  return (
                    <div
                      className="relative p-8 rounded-3xl border shadow-lg shadow-primary/10 max-w-xs w-full group"
                      key={i}
                    >
                      {isMyComment && commentId && props.onDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            props.onDelete?.(commentId);
                          }}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          aria-label="댓글 삭제"
                        >
                          <XIcon className="size-4" />
                        </button>
                      )}
                      <div>{text}</div>
                      <div className="flex items-center gap-2 mt-4">
                        <img
                          width={32}
                          height={32}
                          src={image}
                          alt={name}
                          className="h-6 w-6 rounded-full"
                        />
                        <div className="flex flex-col">
                          <div className="text-sm font-medium tracking-tight leading-tight">
                            {name}
                          </div>
                          <div className="text-xs leading-tight opacity-60 tracking-tight">
                            {role}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
