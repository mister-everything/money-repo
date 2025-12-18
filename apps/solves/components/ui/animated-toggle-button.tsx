"use client";

import type { VariantProps } from "class-variance-authority";
import { AnimationSequence, useAnimate } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, type buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1) + min);
const randomFloat = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

interface AnimatedToggleButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** 버스트 애니메이션에 사용할 아이콘 */
  burstIcon: LucideIcon;
  /** 애니메이션 아이콘 개수 */
  iconCount?: number;
  /** 초기 활성화 상태 (uncontrolled) */
  defaultActive?: boolean;
  /** 활성화 상태 (controlled) */
  active?: boolean;
  /** 활성화 상태 변경 콜백 */
  onActiveChange?: (active: boolean) => void;
  /** 버스트 아이콘에 적용할 클래스 */
  burstIconClassName?: string;
}

function AnimatedToggleButton({
  burstIcon: BurstIcon,
  iconCount = 10,
  defaultActive = false,
  active: controlledActive,
  onActiveChange,
  burstIconClassName,
  className,
  onClick,
  children,
  ...props
}: AnimatedToggleButtonProps) {
  const isControlled = controlledActive !== undefined;
  const [internalActive, setInternalActive] = useState(defaultActive);
  const isActive = isControlled ? controlledActive : internalActive;

  // 초기 마운트 시에는 애니메이션 스킵
  const isFirstRender = useRef(true);
  const prevActive = useRef(isActive);

  const [scope, animate] = useAnimate();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const newActive = !isActive;

      if (!isControlled) {
        setInternalActive(newActive);
      }

      onActiveChange?.(newActive);
      onClick?.(e);
    },
    [isActive, isControlled, onActiveChange, onClick],
  );

  useEffect(() => {
    // 첫 렌더링이거나 off→on이 아닌 경우 스킵
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevActive.current = isActive;
      return;
    }

    // off → on 일 때만 애니메이션 실행
    const wasOff = !prevActive.current;
    const isNowOn = isActive;
    prevActive.current = isActive;

    if (!(wasOff && isNowOn)) {
      return;
    }

    const indices = Array.from({ length: iconCount }, (_, i) => i);

    const reset = indices.map((index) => [
      `.burst-icon-${index}`,
      { x: 0, y: 0, opacity: 0, scale: 0 },
      { duration: 0 },
    ]);

    const burst = indices.map((index) => [
      `.burst-icon-${index}`,
      {
        x: randomInt(-100, 100),
        y: randomInt(-100, 100),
        opacity: [0, 1, 0],
        scale: [0, randomFloat(1, 1.5), 0],
      },
      {
        duration: 0.7,
        at: 0,
      },
    ]);

    animate([...reset, ...burst] as AnimationSequence);
  }, [animate, iconCount, isActive]);

  return (
    <div ref={scope}>
      <Button
        className={cn("relative", className)}
        onClick={handleClick}
        aria-pressed={isActive}
        {...props}
      >
        {children}
        <span aria-hidden className="pointer-events-none absolute inset-0 z-50">
          {Array.from({ length: iconCount }).map((_, index) => (
            <BurstIcon
              key={index}
              className={cn(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0",
                burstIconClassName,
                `burst-icon-${index}`,
              )}
            />
          ))}
        </span>
      </Button>
    </div>
  );
}

export { AnimatedToggleButton, type AnimatedToggleButtonProps };
