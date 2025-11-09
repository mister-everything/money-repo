"use client";

import { ProbBook } from "@service/solves/shared";
import { BookOpen, CheckIcon, List } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetcher } from "@/lib/fetcher";
import { ProblemHeader } from "./problem-header";

// import { ProblemBookHeader } from "./problem-book-header";

interface SolveModeSelectorProps {
  probBook: ProbBook;
  onModeSelect: (mode: "all" | "sequential") => void;
}

export const SolveModeSelector: React.FC<SolveModeSelectorProps> = ({
  probBook,
  onModeSelect,
}) => {
  const [hasExistingSession, setHasExistingSession] = useState(false);
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"all" | "sequential" | null>(
    null,
  );

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetcher<{
          success: boolean;
          data: {
            submitId: string;
            startTime: Date;
            savedAnswers: Record<string, unknown>;
          };
        }>(`/api/workbooks/${probBook.id}/session`, {
          method: "GET",
        });

        if (
          response?.success &&
          response.data &&
          Object.keys(response.data.savedAnswers || {}).length > 0
        ) {
          setHasExistingSession(true);
        }
      } catch (error) {
        console.error("세션 확인 실패:", error);
      }
    };

    checkSession();
  }, [probBook.id]);

  const handleModeClick = (mode: "all" | "sequential") => {
    setSelectedMode(mode);
    if (hasExistingSession) {
      setShowContinueDialog(true);
    } else {
      onModeSelect(mode);
    }
  };

  const handleContinue = () => {
    setShowContinueDialog(false);
    if (selectedMode) {
      onModeSelect(selectedMode);
    }
  };

  const handleRestart = async () => {
    try {
      // 세션을 초기화하기 위해 빈 답안으로 저장
      const response = await fetcher<{
        success: boolean;
        data: {
          submitId: string;
          startTime: Date;
          savedAnswers: Record<string, unknown>;
        };
      }>(`/api/workbook/${probBook.id}/session`, {
        method: "GET",
      });

      if (response?.success && response.data) {
        await fetcher(`/api/workbook/${probBook.id}/save`, {
          method: "POST",
          body: JSON.stringify({
            submitId: response.data.submitId,
            answers: {},
          }),
        });
      }
    } catch (error) {
      console.error("세션 초기화 실패:", error);
    }

    setShowContinueDialog(false);
    if (selectedMode) {
      onModeSelect(selectedMode);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        <ProblemHeader probBook={probBook} />
        {/* 전체 풀이 모드 */}
        <Card className="text-primary border-1">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-1 hover:border-primary mr-4 ml-4"
            onClick={() => handleModeClick("all")}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <List className="h-6 w-6 text-primary" />
                <CardTitle>전체 풀이</CardTitle>
              </div>
              <CardDescription>
                모든 문제를 한 화면에서 확인하며 풀 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-sm border-primary">
                <CheckIcon className="size-4" />
                전체 파악이 쉬워요
              </Badge>
            </CardContent>
          </Card>

          {/* 한 문제씩 풀이 모드 */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-1 hover:border-primary mr-4 ml-4"
            onClick={() => handleModeClick("sequential")}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <CardTitle>한 문제씩 보기</CardTitle>
              </div>
              <CardDescription>
                한 화면에 한 문제만 표시되며, 이전/다음 버튼으로 이동합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-sm border-primary">
                <CheckIcon className="size-4 text-sm" />
                집중하기 좋아요
              </Badge>
            </CardContent>
          </Card>
        </Card>
      </div>

      {/* 계속하기 / 다시 시작 다이얼로그 */}
      <Dialog open={showContinueDialog} onOpenChange={setShowContinueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이전 풀이 이력이 있습니다</DialogTitle>
            <DialogDescription>
              이전에 풀던 문제집이 있습니다. 이어서 풀까요, 아니면 새로
              시작할까요?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleRestart}>
              새로 풀기
            </Button>
            <Button onClick={handleContinue}>이어서 풀기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
