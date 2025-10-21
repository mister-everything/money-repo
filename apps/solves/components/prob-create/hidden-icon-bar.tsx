"use client";

import { motion } from "framer-motion";
import { Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HiddenIconBarProps {
  onOpenChat: () => void;
  onNewChat: () => void;
}

export function HiddenIconBar({ onOpenChat, onNewChat }: HiddenIconBarProps) {
  return (
    <motion.div
      className="w-12 bg-black/50 border-r border-white/10 flex flex-col items-center py-4 space-y-4"
      initial={{ opacity: 0, x: -48 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        variant="outline"
        size="sm"
        className="bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30 w-8 h-8 p-0"
        onClick={onOpenChat}
        title="채팅 열기"
      >
        <Send className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-black/20 border-white/30 text-white hover:bg-white/10 w-8 h-8 p-0"
        title="새 채팅"
        onClick={onNewChat}
      >
        <Plus className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}
