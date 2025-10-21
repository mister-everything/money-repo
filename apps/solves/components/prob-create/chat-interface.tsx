"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Image, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageBubble } from "./message-bubble";
import type { Message } from "./types";

interface ChatInterfaceProps {
  messages: Message[];
  inputValue: string;
  leftPanelWidth: number;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
}

export function ChatInterface({
  messages,
  inputValue,
  leftPanelWidth,
  onInputChange,
  onKeyPress,
  onSendMessage,
}: ChatInterfaceProps) {
  return (
    <AnimatePresence mode="wait">
      {leftPanelWidth > 0 && (
        <motion.div
          className="border-r border-white/10 flex flex-col overflow-hidden"
          style={{ width: `${leftPanelWidth}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2 items-end">
              <Textarea
                placeholder="질문하거나 프롬프트를 입력하세요"
                className="flex-1 bg-black/20 border-white/30 text-white placeholder:text-white/60 rounded-xl resize-none"
                rows={2}
                value={inputValue}
                onChange={onInputChange}
                onKeyPress={onKeyPress}
              />
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-black/20 border-white/30 text-white hover:bg-white/10"
                >
                  <Image className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-xl"
                  onClick={onSendMessage}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
