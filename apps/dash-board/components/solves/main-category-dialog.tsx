"use client";

import { Loader, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AddMainCategoryData,
  UpdateMainCategoryData,
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
import { SafeFunction } from "@/lib/protocol/interface";
import { useSafeAction } from "@/lib/protocol/use-safe-action";

type Category = {
  id: number;
  name: string;
  description: string | null;
  aiPrompt: string | null;
};

type MainCategoryDialogProps =
  | {
      mode: "add";
      action: SafeFunction<AddMainCategoryData, any>;
    }
  | {
      mode: "edit";
      action: SafeFunction<UpdateMainCategoryData, any>;
      category: Category;
    };

export function MainCategoryDialog(props: MainCategoryDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const initialCategory = props.mode === "edit" ? props.category : null;
  const [name, setName] = useState(initialCategory?.name || "");
  const [description, setDescription] = useState(
    initialCategory?.description || ""
  );
  const [aiPrompt, setAiPrompt] = useState(initialCategory?.aiPrompt || "");

  // edit mode에서 category prop이 변경되면 폼 값 업데이트
  useEffect(() => {
    if (props.mode === "edit") {
      setName(props.category.name);
      setDescription(props.category.description || "");
      setAiPrompt(props.category.aiPrompt || "");
    }
  }, [props.mode === "edit" && props.category]);

  const [, executeAction, isPending] = useSafeAction(props.action as any, {
    onSuccess: () => {
      toast.success(
        props.mode === "add"
          ? "대분류가 추가되었습니다."
          : "대분류가 수정되었습니다."
      );
      setOpen(false);
      resetForm();
      router.refresh();
    },
    onError: (error) => {
      toast.error(
        error.message ||
          (props.mode === "add"
            ? "대분류 추가에 실패했습니다."
            : "대분류 수정에 실패했습니다.")
      );
    },
  });

  const resetForm = () => {
    if (props.mode === "add") {
      setName("");
      setDescription("");
      setAiPrompt("");
    } else {
      setName(props.category.name);
      setDescription(props.category.description || "");
      setAiPrompt(props.category.aiPrompt || "");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const handleCancel = () => {
    setOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (props.mode === "add") {
      const data: AddMainCategoryData = {
        name,
        description: description || undefined,
        aiPrompt: aiPrompt || undefined,
      };
      executeAction(data as any);
    } else {
      const data: UpdateMainCategoryData = {
        id: props.category.id,
        name,
        description: description || undefined,
        aiPrompt: aiPrompt || undefined,
      };
      executeAction(data as any);
    }
  };

  const isValid = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {props.mode === "add" ? (
          <Button variant="default" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            대분류 추가
          </Button>
        ) : (
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {props.mode === "add" ? "대분류 추가" : "대분류 수정"}
          </DialogTitle>
          <DialogDescription>
            {props.mode === "add"
              ? "새로운 대분류를 추가합니다. 대분류 이름은 필수입니다."
              : "대분류 정보를 수정합니다. 대분류 이름은 필수입니다."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">
              대분류 이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="예: 영화"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={300}
              disabled={isPending}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              최대 300자 ({description.length}/300)
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="aiPrompt">AI Prompt</Label>
            <Textarea
              id="aiPrompt"
              placeholder="AI 생성 시 사용할 프롬프트를 입력하세요"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
              maxLength={300}
              disabled={isPending}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              최대 300자 ({aiPrompt.length}/300)
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending || !isValid}>
              {isPending ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  {props.mode === "add" ? "추가 중..." : "수정 중..."}
                </>
              ) : props.mode === "add" ? (
                "추가"
              ) : (
                "수정"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
