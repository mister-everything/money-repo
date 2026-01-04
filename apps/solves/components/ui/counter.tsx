"use client";

import { animate, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface CounterProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  suffixClassName?: string;
  prefix?: string;
}

export function Counter({
  value,
  duration = 1,
  className,
  suffix,
  suffixClassName = "text-sm font-normal text-muted-foreground ml-1",
  prefix,
}: CounterProps) {
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest).toLocaleString());
      },
    });

    return () => controls.stop();
  }, [value, duration]);

  return (
    <motion.span className={className}>
      {prefix}
      {displayValue}
      {suffix && <span className={suffixClassName}>{suffix}</span>}
    </motion.span>
  );
}
