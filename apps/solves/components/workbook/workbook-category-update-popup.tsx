import { errorToString, isNull } from "@workspace/util";
import { Loader } from "lucide-react";
import { useState } from "react";
import { updateWorkBookCategoryAction } from "@/actions/workbook";
import { useCategories } from "@/hooks/query/use-categories";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { CategorySelector } from "./category-selector";

export function WorkBookCategoryUpdatePopup({
  workBookId,
  onSavedCategory,
  children,
}: {
  workBookId: string;
  onSavedCategory?: (categoryId: number) => void;
  children: React.ReactNode;
}) {
  const [categoryId, setCategoryId] = useState<number>();
  const [open, setOpen] = useState(false);

  const { data: categories, isLoading: isCategoriesLoading } = useCategories();
  const [, updateWorkBookCategory, isPending] = useSafeAction(
    updateWorkBookCategoryAction,
    {
      onSuccess: (res) => {
        onSavedCategory?.(res.categoryId);
        setOpen(false);
      },
      failMessage: errorToString,
    },
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="min-h-[400px] max-h-[80vh] overflow-y-auto md:max-w-2xl!">
        <DialogHeader>
          <DialogTitle>소재를 선택해주세요.</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <CategorySelector
          className="gap-6"
          categories={categories}
          value={categoryId}
          onCategoryChange={setCategoryId}
          isLoading={isCategoriesLoading}
        />
        <DialogFooter className="mt-auto">
          <Button variant="outline" onClick={() => setOpen(false)}>
            닫기
          </Button>
          <Button
            onClick={() =>
              updateWorkBookCategory({ workBookId, categoryId: categoryId! })
            }
            disabled={isPending || isNull(categoryId)}
          >
            {isPending ? <Loader className="animate-spin" /> : null}
            소재 선택하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
