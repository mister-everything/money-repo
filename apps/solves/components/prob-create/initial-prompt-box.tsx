"use client";

import { motion } from "framer-motion";
import { Image, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface InitialPromptBoxProps {
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
}

export function InitialPromptBox({
  inputValue,
  onInputChange,
  onKeyPress,
  onSendMessage,
}: InitialPromptBoxProps) {
  return (
    <div className="flex items-center justify-center h-full p-4">
      <motion.div
        className="w-full max-w-6xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="bg-gradient-to-br from-blue-900 via-black-900 to-orange-500 border-0 shadow-none rounded-xl">
          <div className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left Section - Input & Controls */}
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                {/* Input Field */}
                <div className="relative">
                  <Textarea
                    placeholder="구체적일수록 좋은 문제를 만들어줘요."
                    className="w-full h-24 bg-black/20 border-white/30 text-white placeholder:text-white/60 rounded-xl resize-none"
                    value={inputValue}
                    onChange={onInputChange}
                    onKeyPress={onKeyPress}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-black/20 border-white/30 text-white hover:bg-white/10"
                    >
                      <Image className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="lg"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 rounded-xl flex items-center gap-2"
                      onClick={onSendMessage}
                    >
                      <Sparkles className="w-5 h-5" />
                      문제집 생성
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Right Section - Text */}
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <motion.h2
                  className="text-white text-3xl md:text-4xl font-bold leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  어떤 문제집을 만들어 볼까요?
                </motion.h2>
                <motion.p
                  className="text-white text-lg opacity-90"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.6 }}
                >
                  AI에게 문제집을 만들어달라고 부탁해보세요.
                </motion.p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
