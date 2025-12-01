"use client";

import { WorkBookWithoutAnswer } from "@service/solves/shared";
import { BookOpen, CheckIcon, List } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ProblemHeader } from "@/components/problem/problem-header";
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
import { logger } from "@/lib/logger";
import { fetcher } from "@/lib/protocol/fetcher";

interface SolveModeSelectorProps {
  workBook: WorkBookWithoutAnswer;
  onModeSelect: (mode: "all" | "sequential") => void;
}

export const SolveModeSelector: React.FC<SolveModeSelectorProps> = ({
  workBook,
  onModeSelect,
}) => {
  const [hasSession, setHasSession] = useState<boolean>(false);
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"all" | "sequential" | null>(
    null,
  );

  const fetchSession = useCallback(async () => {
    const response = await fetcher<boolean>(
      `/api/workbooks/${workBook.id}/session/check`,
      {
        method: "GET",
      },
    );
    if (response) {
      setHasSession(response);
    }
  }, [workBook.id]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleModeClick = (mode: "all" | "sequential") => {
    setSelectedMode(mode);
    if (hasSession) {
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
      if (hasSession) {
        await fetcher(`/api/workbooks/${workBook.id}/session`, {
          method: "DELETE",
        });
        // 세션 삭제 후 상태 초기화
        setHasSession(false);
      }
    } catch (error) {
      logger.error("세션 초기화 실패:", error);
      return;
    }

    setShowContinueDialog(false);
    if (selectedMode) {
      onModeSelect(selectedMode);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        <ProblemHeader workBook={workBook} />
        {/* 전체 풀이 모드 */}
        <Card className="text-primary border-none">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow  hover:border-primary mr-4 ml-4"
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
            className="cursor-pointer hover:shadow-lg transition-shadow hover:border-primary mr-4 ml-4"
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
