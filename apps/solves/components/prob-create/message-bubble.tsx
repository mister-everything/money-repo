"use client";

import { motion } from "framer-motion";
import type { Message } from "./types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <motion.div
      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`max-w-[80%] px-4 py-2 rounded-xl ${
          message.type === "user"
            ? "bg-blue-500 text-white"
            : "bg-gray-600 text-white"
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  );
}
