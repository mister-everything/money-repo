"use client";

import type { ProbBlockWithoutAnswer } from "@service/solves/shared";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultipleChoiceProblem, OpenEndedProblem } from "./problem-types";

interface ProblemSetDisplayProps {
  problems: ProbBlockWithoutAnswer[];
}

export function ProblemSetDisplay({ problems }: ProblemSetDisplayProps) {
  return (
    <>
      {/* Problem Set Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white text-2xl font-bold">
              {problems.length > 0 ? "대수학 기초 문제집" : "문제집 제목"}
            </h2>
            <p className="text-white/60 text-sm mt-1">
              {problems.length > 0
                ? "기초 대수학 문제 모음"
                : "문제를 생성해주세요"}
            </p>
          </div>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-xl flex items-center gap-2">
            Publishing
          </Button>
        </div>
      </div>

      {/* Problems List */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence>
          {problems.length === 0 ? (
            <motion.div
              className="flex items-center justify-center h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center">
                <Sparkles className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/60 text-lg">
                  왼쪽에서 AI와 대화하여 문제를 생성해보세요!
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {problems.map((problem, index) =>
                problem.type === "mcq" ? (
                  <MultipleChoiceProblem
                    key={problem.id}
                    problem={problem}
                    index={index}
                  />
                ) : (
                  <OpenEndedProblem
                    key={problem.id}
                    problem={problem}
                    index={index}
                  />
                ),
              )}

              {/* Add New Problem Button */}
              <div className="flex justify-center pt-8 pb-4">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 rounded-xl text-lg font-semibold flex items-center gap-2">
                  <Plus className="w-5 h-5" />새 문제 추가
                </Button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
