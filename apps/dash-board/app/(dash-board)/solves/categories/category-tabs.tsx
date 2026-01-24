"use client";

import { CategoryTree } from "@service/solves/shared";
import { isNull } from "@workspace/util";
import {
  ChevronRightIcon,
  Loader,
  Pencil,
  PlusIcon,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteCategoryAction } from "@/app/(dash-board)/solves/categories/actions";
import { CategoryDialog } from "@/components/solves/category-dialog";
import { Button } from "@/components/ui/button";
import { ButtonSelect } from "@/components/ui/button-select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { notify } from "@/components/ui/notify";
import { Separator } from "@/components/ui/separator";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";

interface Props {
  categories: CategoryTree[];
}

export function CategoryTabs({ categories }: Props) {
  const router = useRouter();

  const flatedCategories = useMemo(
    () => categories.flatMap((c) => [c, ...c.children]),
    [categories],
  );

  const [selectedId, setSelectedId] = useState<number | undefined>(
    categories[0]?.id,
  );

  const selectedCategory = useMemo(() => {
    return flatedCategories.find((v) => v.id == selectedId);
  }, [flatedCategories, selectedId]);

  const oneDepthCategory = useMemo(() => {
    if (!selectedCategory) return;
    if (isNull(selectedCategory.parentId)) return selectedCategory;
    return flatedCategories.find((c) => c.id == selectedCategory.parentId);
  }, [flatedCategories, selectedCategory]);

  const twoDepthCategories = useMemo(() => {
    return oneDepthCategory?.children ?? [];
  }, [oneDepthCategory]);

  const [, deleteCategory, isDeleting] = useSafeAction(deleteCategoryAction, {
    onSuccess: () => {
      toast.success("삭제되었습니다.");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "삭제에 실패했습니다.");
    },
  });
  const handleDeleteCategory = async (category: CategoryTree) => {
    const confirmed = await notify.confirm({
      title: "삭제",
      description: `"${category.name}" 삭제하시겠습니까? ${isNull(category.parentId) ? "이 분류에 속한 모든 중분류도 함께 삭제됩니다." : ""}`,
      okText: "삭제",
      cancelText: "취소",
    });
    if (!confirmed) return;
    deleteCategory({ categoryId: category.id });
  };

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("ko", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <section className="flex flex-col gap-4 bg-red">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryDialog>
            <Button className="rounded-full" size={"sm"}>
              <PlusIcon /> 대분류 추가
            </Button>
          </CategoryDialog>
          <ButtonSelect
            value={oneDepthCategory?.id?.toString()}
            onChange={(value) =>
              setSelectedId(value ? Number(value) : undefined)
            }
            options={categories.map((category) => ({
              label: category.name,
              value: category.id.toString(),
            }))}
          />
        </div>
        {oneDepthCategory && (
          <div className="flex flex-wrap gap-2 fade-300">
            <CategoryDialog initialCategory={{ parentId: oneDepthCategory.id }}>
              <Button className="rounded-full" size={"sm"}>
                <PlusIcon />
                {oneDepthCategory.name}의 중분류 추가
              </Button>
            </CategoryDialog>
            {twoDepthCategories.map((category) => (
              <Button
                key={category.id}
                size={"sm"}
                variant="secondary"
                onClick={() => setSelectedId(category.id)}
                className={cn(
                  "cursor-pointer rounded-full hover:bg-primary/10 transition-all",
                  selectedId === category.id &&
                    "bg-primary/5 hover:bg-primary/10 ring-primary ring",
                )}
              >
                {category.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {selectedCategory && (
        <Card className="shadow-none">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                {oneDepthCategory?.id == selectedCategory.parentId ? (
                  <>
                    {oneDepthCategory!.name}{" "}
                    <ChevronRightIcon className="text-muted-foreground" />
                  </>
                ) : (
                  ""
                )}
                {selectedCategory.name}
              </CardTitle>
              <CardDescription>순서: {selectedCategory.order}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{formatDate(selectedCategory.createdAt)}</span>
              </div>
              <div className="h-4">
                <Separator orientation="vertical" />
              </div>
              <div className="flex items-center gap-1">
                <CategoryDialog
                  id={selectedId}
                  initialCategory={selectedCategory}
                >
                  <Button variant="ghost" size="icon" disabled={isDeleting}>
                    <Pencil className="text-muted-foreground" />
                  </Button>
                </CategoryDialog>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isDeleting}
                  onClick={() => handleDeleteCategory(selectedCategory)}
                >
                  {isDeleting ? (
                    <Loader className="text-destructive animate-spin" />
                  ) : (
                    <Trash2 className="text-destructive" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Label className="text-muted-foreground ml-2" htmlFor="description">
              설명
            </Label>
            <div className="rounded-xl border bg-muted/40 p-4 mb-6">
              <p className="leading-relaxed text-foreground">
                {selectedCategory.description || (
                  <span className="text-muted-foreground">설명 미작성</span>
                )}
              </p>
            </div>
            <Label className="text-muted-foreground ml-2" htmlFor="aiPrompt">
              AI Prompt
            </Label>
            <div className="rounded-xl border bg-muted/40 p-4 mb-6">
              <p className="leading-relaxed text-foreground">
                {selectedCategory.aiPrompt || (
                  <span className="text-muted-foreground">
                    AI Prompt 미작성
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
