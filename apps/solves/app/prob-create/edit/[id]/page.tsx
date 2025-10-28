"use client";

import type { ProbBlockWithoutAnswer } from "@service/solves/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChatPanel } from "@/components/prob-create/chat-panel";
import { ProbHeader } from "@/components/prob-create/prob-header";
import { ProblemSetDisplay } from "@/components/prob-create/problem-set-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ProbEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [problems, setProblems] = useState<ProbBlockWithoutAnswer[]>([
    {
      id: crypto.randomUUID(),
      question: "핀란드의 수도는 어디인가요?",
      type: "mcq",
      content: {
        type: "mcq",
        options: [
          {
            id: "opt-1",
            type: "text" as const,
            text: "1시간 전 • 우리 팀이 외근으로 이동중에 30분 동안 즐길 수 있는...",
          },
          {
            id: "opt-2",
            type: "text" as const,
            text: "1시간 전 • 문제집 수정",
          },
        ],
      },
      order: 0,
    },
    {
      id: crypto.randomUUID(),
      question: "대한민국의 수도는 어디인가요?",
      type: "mcq",
      content: {
        type: "mcq",
        options: [
          {
            id: "opt-3",
            type: "text" as const,
            text: "참부한 그 스타일로 치면 이미지를 추가해서",
          },
          {
            id: "opt-4",
            type: "text" as const,
            text: "추가로 제공해 주기로 출제해줘",
          },
        ],
      },
      order: 1,
    },
    {
      id: crypto.randomUUID(),
      question: "펭귄은 북극에 산다",
      type: "default",
      content: {
        type: "default",
      },
      order: 2,
    },
    {
      id: crypto.randomUUID(),
      question: "이 배우의 이름은?",
      type: "mcq",
      content: {
        type: "mcq",
        options: [
          {
            id: "opt-5",
            type: "text" as const,
            text: "디한민국 배우 출신 타이어 이미지로 추가해서",
          },
          {
            id: "opt-6",
            type: "text" as const,
            text: "추가로 3초 타이어 출제해줘",
          },
        ],
      },
      order: 3,
    },
    {
      id: crypto.randomUUID(),
      question: "이 노래의 제목은?",
      type: "default",
      content: {
        type: "default",
      },
      order: 4,
    },
  ]);

  const handleEdit = (problemId: string) => {
    console.log("Edit problem:", problemId);
    // TODO: 문제 수정 모달 또는 페이지 열기
  };

  const handleDelete = (problemId: string) => {
    //
    if (window.confirm("정말 이 문제를 삭제하시겠습니까?")) {
      setProblems((prev) => prev.filter((p) => p.id !== problemId));
    }
  };

  const handleView = (problemId: string) => {
    console.log("View problem:", problemId);
    // TODO: 문제 상세 보기 모달 또는 페이지 열기
  };

  const tags = [
    "#3인 이상",
    "#진득",
    "#OX개입",
    "#날말퀴즈",
    "#하이브리드",
    "#성인",
    "#일반상식",
    "#보통",
  ];

  return (
    <div className="flex h-screen flex-col relative">
      <ProbHeader showBackButton onBack={() => router.push("/prob-create")} />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Panel - Problem Set Info and Cards */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-8 space-y-4">
              <div>
                <h1 className="mb-2 text-2xl font-bold text-foreground">
                  문제집 제목
                </h1>
                <p className="text-sm text-muted-foreground">
                  문제집 한줄 설명 어쩌구
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-md">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <ProblemSetDisplay
              problems={problems}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />

            <div className="mt-8 flex justify-end">
              <Button
                size="lg"
                className="rounded-lg px-8"
                onClick={() => console.log("전체 미리보기")}
              >
                전체 미리보기
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-[35%] border-l border-border bg-background overflow-hidden">
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}
