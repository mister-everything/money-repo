"use client";
import { motion, useAnimationControls } from "framer-motion";
import { XIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

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
  const controls = useAnimationControls();
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    if (isHovered) {
      // hover 시 애니메이션 일시정지 (현재 위치 유지)
      if (isAnimatingRef.current) {
        controls.stop();
        isAnimatingRef.current = false;
      }
    } else {
      // hover 해제 시 애니메이션 재개 (현재 위치에서 계속)
      if (!isAnimatingRef.current) {
        controls.start({
          translateY: "-50%",
          transition: {
            duration: props.duration || 10,
            repeat: Infinity,
            ease: "linear",
            repeatType: "loop",
          },
        });
        isAnimatingRef.current = true;
      }
    }
  }, [isHovered, isAnimatingRef, controls]);

  return (
    <div
      className={props.className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        animate={controls}
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
                      className="relative p-10 rounded-3xl border shadow-lg shadow-primary/10 max-w-xs w-full group"
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
                      <div className="flex items-center gap-2 mt-5">
                        <img
                          width={40}
                          height={40}
                          src={image}
                          alt={name}
                          className="h-8 w-8 rounded-full"
                        />
                        <div className="flex flex-col">
                          <div className="font-medium tracking-tight leading-5">
                            {name}
                          </div>
                          <div className="leading-5 opacity-60 tracking-tight">
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
