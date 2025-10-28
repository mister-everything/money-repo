"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface HistoryItem {
  id: string;
  timestamp: Date;
  action: string;
  description: string;
}

interface ProblemHistoryProps {
  problemId: string;
  history?: HistoryItem[];
}

export function ProblemHistory({
  problemId,
  history = [],
}: ProblemHistoryProps) {
  // 더미 히스토리 데이터
  const defaultHistory: HistoryItem[] = history.length
    ? history
    : [
        {
          id: "1",
          timestamp: new Date(Date.now() - 3600000),
          action: "생성",
          description: "우리 팀이 외근으로 이동중에 30분 동안 즐길 수 있는...",
        },
        {
          id: "2",
          timestamp: new Date(Date.now() - 1800000),
          action: "문제집 수정",
          description: "문제 난이도 조정 요청",
        },
        {
          id: "3",
          timestamp: new Date(Date.now() - 900000),
          action: "선택지 추가",
          description: "사용자 질의: 선택지를 더 추가해 주세요",
        },
        {
          id: "4",
          timestamp: new Date(Date.now() - 300000),
          action: "난이도 변경",
          description: "보이도록 좀 더 쉽게 변경 나타나는 선택 퀴즈로 바꿔줘",
        },
      ];

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}초 전`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  return (
    <div className="mt-4 border-t border-border pt-4">
      <Accordion type="single" collapsible>
        <AccordionItem value="history" className="border-none">
          <AccordionTrigger className="px-2 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:no-underline">
            생성 내역
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <div className="mt-2 space-y-2">
              {defaultHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md bg-muted/50 p-3 text-xs transition-colors hover:bg-muted"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {item.action}
                    </span>
                    <span className="text-muted-foreground">
                      {getTimeAgo(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
