"use client";

import { Category } from "@service/solves/shared";
import { isNull } from "@workspace/util";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  addCategoryAction,
  updateCategoryAction,
} from "@/app/(dash-board)/solves/categories/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSafeAction } from "@/lib/protocol/use-safe-action";

type MutateableCategory = Omit<Category, "id" | "createdAt">;

const defaultCategory: MutateableCategory = {
  name: "",
  description: null,
  aiPrompt: null,
  parentId: null,
};

export function CategoryDialog(props: {
  id?: number;
  initialCategory?: Partial<MutateableCategory>;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = !isNull(props.id);

  const router = useRouter();
  const [_open, _setOpen] = useState(false);
  const open = props.open ?? _open;
  const setOpen = props.onOpenChange ?? _setOpen;
  const [, addCategory, isAdding] = useSafeAction(addCategoryAction, {
    onSuccess: () => {
      router.refresh();
      setOpen(false);
    },
    successMessage: "추가되었습니다.",
    failMessage: "추가에 실패했습니다.",
  });
  const [, updateCategory, isUpdating] = useSafeAction(updateCategoryAction, {
    onSuccess: () => {
      router.refresh();
      setOpen(false);
    },
    successMessage: "수정되었습니다.",
    failMessage: "수정에 실패했습니다.",
  });

  const [category, setCategory] = useState<MutateableCategory>({
    ...defaultCategory,
    ...props.initialCategory,
  });

  const isPending = isAdding || isUpdating;

  useEffect(() => {
    if (open) {
      setCategory({ ...defaultCategory, ...props.initialCategory });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isNull(props.initialCategory?.parentId) ? "대분류" : "중분류"}{" "}
            {isEdit ? "수정" : "추가"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "소재를 수정합니다." : "소재를 추가합니다."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="name">
            소재 이름 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="소재 이름을 입력하세요"
            value={category.name || ""}
            onChange={(e) => setCategory({ ...category, name: e.target.value })}
            required
            maxLength={50}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">최대 50자</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">설명</Label>
          <Textarea
            id="description"
            placeholder="대분류에 대한 설명을 입력하세요"
            value={category.description || ""}
            onChange={(e) =>
              setCategory({ ...category, description: e.target.value })
            }
            rows={3}
            maxLength={300}
            disabled={isPending}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            최대 300자 ({category.description?.length}/300)
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="aiPrompt">AI Prompt</Label>
          <Textarea
            id="aiPrompt"
            placeholder="AI 생성 시 사용할 프롬프트를 입력하세요"
            value={category.aiPrompt || ""}
            onChange={(e) =>
              setCategory({ ...category, aiPrompt: e.target.value })
            }
            rows={3}
            maxLength={300}
            disabled={isPending}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            최대 300자 ({category.aiPrompt?.length}/300)
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            취소
          </Button>
          <Button
            onClick={() => {
              if (isEdit) {
                updateCategory({
                  id: props.id!,
                  name: category.name,
                  description: category.description ?? undefined,
                  aiPrompt: category.aiPrompt ?? undefined,
                });
              } else {
                addCategory({
                  name: category.name,
                  parentId: category.parentId ?? undefined,
                  description: category.description ?? undefined,
                  aiPrompt: category.aiPrompt ?? undefined,
                });
              }
            }}
            disabled={isPending || !category.name.trim().length}
          >
            {isPending ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                {isEdit ? "수정 중..." : "추가 중..."}
              </>
            ) : isEdit ? (
              "수정"
            ) : (
              "추가"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
