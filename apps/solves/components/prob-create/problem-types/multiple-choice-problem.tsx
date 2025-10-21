"use client";

import type {
  McqBlockContent,
  ProbBlockWithoutAnswer,
} from "@service/solves/shared";
import { motion } from "framer-motion";
import { Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MultipleChoiceProblemProps {
  problem: ProbBlockWithoutAnswer;
  index: number;
}

export function MultipleChoiceProblem({
  problem,
  index,
}: MultipleChoiceProblemProps) {
  // mcq 타입이 아니면 렌더링하지 않음
  if (problem.type !== "mcq") return null;

  const content = problem.content as McqBlockContent;
  const options = content.options;

  return (
    <motion.div
      className="bg-white/5 border border-white/10 rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1">
          <p className="text-white text-lg mb-4">{problem.question}</p>

          <div className="space-y-2">
            {options.map((option) => (
              <div
                key={option.id}
                className="p-3 rounded-lg border bg-white/5 border-white/20 text-white/80"
              >
                {option.type === "text" ? option.text : "미디어"}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-black/20 border-white/30 text-white hover:bg-white/10"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
