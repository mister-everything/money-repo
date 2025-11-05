"use client";

import type { ProbBlock } from "@service/solves/shared";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { ProbHeader } from "@/components/prob-create/prob-header";
import { ProblemSetDisplay } from "@/components/prob-create/problem-set-display";
import { ResizableChatPanel } from "@/components/prob-create/resizable-chat-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProbCreateStore } from "@/store/prob-create";

export default function ProbEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  useEffect(() => {
    console.log(">", id);
  }, [id]);

  const router = useRouter();
  const { formData } = useProbCreateStore();
  const [problems, setProblems] = useState<ProbBlock[]>([
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
            text: "헬싱키",
          },
          {
            id: "opt-2",
            type: "text" as const,
            text: "스톡홀름",
          },
          {
            id: "opt-3",
            type: "text" as const,
            text: "오슬로",
          },
          {
            id: "opt-4",
            type: "text" as const,
            text: "코펜하겐",
          },
        ],
      },
      answer: {
        type: "mcq",
        answer: ["opt-1"],
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
            id: "opt-5",
            type: "text" as const,
            text: "서울",
          },
          {
            id: "opt-6",
            type: "text" as const,
            text: "부산",
          },
          {
            id: "opt-7",
            type: "text" as const,
            text: "인천",
          },
          {
            id: "opt-8",
            type: "text" as const,
            text: "대전",
          },
        ],
      },
      answer: {
        type: "mcq",
        answer: ["opt-5"],
      },
      order: 1,
    },
    {
      id: crypto.randomUUID(),
      question: "펭귄은 북극에 산다",
      type: "ox",
      content: {
        type: "ox",
        oOption: {
          id: "ox-o-1",
          type: "text" as const,
          text: "O",
        },
        xOption: {
          id: "ox-x-1",
          type: "text" as const,
          text: "X",
        },
      },
      answer: {
        type: "ox",
        answer: "x",
      },
      order: 2,
    },
    {
      id: crypto.randomUUID(),
      question: "세종대왕이 창제한 한글의 원래 이름은 무엇인가요?",
      type: "default",
      content: {
        type: "default",
      },
      answer: {
        type: "default",
        answer: ["훈민정음"],
      },
      order: 3,
    },
    {
      id: crypto.randomUUID(),
      question: "지구는 태양계에서 세 번째 행성이다",
      type: "ox",
      content: {
        type: "ox",
        oOption: {
          id: "ox-o-2",
          type: "text" as const,
          text: "O",
        },
        xOption: {
          id: "ox-x-2",
          type: "text" as const,
          text: "X",
        },
      },
      answer: {
        type: "ox",
        answer: "o",
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

  const tags = formData
    ? [
        `#${formData.people}`,
        `#${formData.situation}`,
        `#${formData.format}`,
        `#${formData.platform}`,
        `#${formData.ageGroup}`,
        ...formData.topic.map((t) => `#${t}`),
        `#${formData.difficulty}`,
      ]
    : [];

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Main Panel - Problem Set Info and Cards */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <ProbHeader
            showBackButton
            onBack={() => router.push("/prob-create")}
          />

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
                  className="rounded-lg w-full"
                  onClick={() => console.log("전체 미리보기")}
                >
                  전체 미리보기
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Resizable Chat Panel */}
        <ResizableChatPanel />
      </div>
    </div>
  );
}
