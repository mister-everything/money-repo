import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";

export function WorkbookSolveNavigatePopup() {
  return (
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
  );
}
