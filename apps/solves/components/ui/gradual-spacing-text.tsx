"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";

import { cn } from "@/lib/utils";

interface GradualSpacingProps {
  text: string;
  duration?: number;
  delayMultiple?: number;
  framerProps?: Variants;
  className?: string;
}

function GradualSpacingText({
  text,
  duration = 0.5,
  delayMultiple = 0.04,
  framerProps = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
  className,
}: GradualSpacingProps) {
  return (
    <AnimatePresence>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={framerProps}
          transition={{ duration, delay: i * delayMultiple }}
          className={cn("drop-shadow-sm ", className)}
        >
          {char === " " ? <span>&nbsp;</span> : char}
        </motion.span>
      ))}
    </AnimatePresence>
  );
}

export { GradualSpacingText };
