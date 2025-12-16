"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonSelect } from "@/components/ui/button-select";
import { useCategories } from "@/hooks/query/use-categories";
import { WorkBookSituation } from "@/lib/const";
import { cn } from "@/lib/utils";

import { Badge } from "../ui/badge";

export function QuickWorkbookCreator() {
  const router = useRouter();
  const { data: categories = [] } = useCategories();
  const [situation, setSituation] = useState<string>("");
  const [oneDepthCategoryId, setOneDepthCategoryId] = useState<
    number | undefined
  >(undefined);
  const [twoDepthCategoryId, setTwoDepthCategoryId] = useState<
    number | undefined
  >(undefined);

  const oneDepthCategories = useMemo(() => {
    return categories.filter((category) => category.parentId === null);
  }, [categories]);

  const twoDepthCategories = useMemo(() => {
    return oneDepthCategories
      .flatMap((category) => category.children)
      .filter((category) => category.parentId === oneDepthCategoryId);
  }, [categories, oneDepthCategoryId]);

  const handleNavigate = () => {
    const params = new URLSearchParams();

    if (situation) {
      params.set("situation", situation);
    }
    const categoryId = twoDepthCategoryId ?? oneDepthCategoryId;
    if (categoryId) {
      params.set("categoryId", categoryId.toString());
    }

    const queryString = params.toString();

    router.push(
      `/workbooks/creator/new${queryString ? `?${queryString}` : ""}`,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-foreground">
        어떤 문제집을 만들고 싶나요?
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column: 상황, 유형, 연령대 */}
        <div className="space-y-4">
          {/* 상황 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">상황</label>
            <ButtonSelect
              value={situation}
              onChange={(value) => {
                setSituation(value as string);
              }}
              options={WorkBookSituation.map((value) => ({
                label: value.label,
                value: value.value,
              }))}
            />
          </div>
        </div>

        {/* Right Column: 소재, 난이도 */}
        <div className="space-y-4">
          {/* 소재 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">소재</label>
            <ButtonSelect
              value={oneDepthCategoryId?.toString()}
              onChange={(value) => setOneDepthCategoryId(Number(value))}
              options={oneDepthCategories.map((category) => ({
                label: category.name,
                value: category.id.toString(),
              }))}
            />

            {/* 선택된 카테고리 표시 */}
            {oneDepthCategoryId && (
              <div className="text-sm text-muted-foreground">
                선택:{" "}
                <span className="text-foreground font-medium">
                  {
                    oneDepthCategories.find(
                      (category) => category.id === oneDepthCategoryId,
                    )?.name
                  }
                  {twoDepthCategoryId &&
                    ` > ${twoDepthCategories.find((category) => category.id === twoDepthCategoryId)?.name}`}
                </span>
              </div>
            )}

            {twoDepthCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {twoDepthCategories.map((category) => (
                  <Badge
                    key={category.id}
                    variant="secondary"
                    onClick={() => setTwoDepthCategoryId(category.id)}
                    className={cn(
                      "cursor-pointer rounded-full hover:bg-primary/5 hover:border-primary transition-all",
                      twoDepthCategoryId === category.id &&
                        "bg-primary/5 hover:bg-primary/10 border-primary",
                    )}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Button size="lg" className="w-full py-6" onClick={handleNavigate}>
        빠르게 문제집 만들기
      </Button>
    </div>
  );
}
