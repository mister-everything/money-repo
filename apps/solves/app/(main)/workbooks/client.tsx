"use client";
import { Category, WorkBookWithoutBlocks } from "@service/solves/shared";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import z from "zod";
import { SearchWorkbooksRequest } from "@/app/api/workbooks/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { CategorySelector } from "@/components/workbook/category-selector";
import { WorkbookCard } from "@/components/workbook/workbook-card";
import { useCategories } from "@/hooks/query/use-categories";

const sortOptions = [
  { label: "인기순", value: "popular" },
  { label: "최신순", value: "latest" },
  { label: "평균 점수 높은순", value: "highest" },
  { label: "평균 점수 낮은순", value: "lowest" },
] as const;

export function WorkbooksClient({
  initialWorkBooks = [],
}: {
  initialWorkBooks: WorkBookWithoutBlocks[];
}) {
  const { data: categories, isLoading: isCategoriesLoading } = useCategories({
    fallbackData: [],
  });

  // 선택된 카테고리 ID (단일)
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | undefined
  >();

  const [searchParams, setSearchParams] = useState<
    z.infer<typeof SearchWorkbooksRequest>
  >({
    page: 1,
    limit: 30,
    search: "",
    sort: "latest",
    categoryId: undefined,
  });

  const { data: workBooks, isValidating } = useSWR(
    // `/api/workbooks?${new URLSearchParams(JSON.stringify(searchParams)).toString()}`,
    `/api/workbooks`,
    {
      fallbackData: initialWorkBooks,
      revalidateOnFocus: false,
      revalidateOnMount: false,
    },
  );

  // 선택된 카테고리 정보 찾기
  const findSelectedCategoryInfo = ():
    | { root: Category; child?: Category }
    | undefined => {
    if (!selectedCategoryId || !categories) return undefined;

    for (const root of categories) {
      if (root.id === selectedCategoryId) {
        return { root };
      }
      for (const child of root.children ?? []) {
        if (child.id === selectedCategoryId) {
          return { root, child };
        }
      }
    }
    return undefined;
  };

  const selectedInfo = findSelectedCategoryInfo();

  const handleRemoveCategory = () => {
    setSelectedCategoryId(undefined);
    setSearchParams((prev) => ({ ...prev, categoryId: undefined }));
  };

  const handleCategoryChange = (categoryId: number | undefined) => {
    setSelectedCategoryId(categoryId);
    setSearchParams((prev) => ({ ...prev, categoryId }));
  };

  return (
    <div className="w-full flex flex-col min-h-screen ">
      <div className="p-6 lg:p-10 pb-0!">
        <div className="font-bold text-foreground flex items-center justify-between gap-4">
          <h1 className="text-xl shrink-0">어떤 문제를 풀고싶나요?</h1>
          <Input
            value={searchParams.search}
            onChange={(e) =>
              setSearchParams({
                ...searchParams,
                search: e.currentTarget.value,
              })
            }
            placeholder="키워드 검색"
            className="w-full lg:w-md"
          />
        </div>
        <CategorySelector
          value={selectedCategoryId}
          categories={categories}
          isLoading={isCategoriesLoading}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      <div className="flex flex-col gap-2 bg-secondary/40 border-t p-6 pt-4! lg:p-10 flex-1">
        {/* 선택된 카테고리 표시 */}
        {selectedInfo && (
          <div className="flex flex-wrap gap-2 items-center">
            <Badge
              onClick={handleRemoveCategory}
              className="rounded-full cursor-pointer group"
            >
              {selectedInfo.root.name}
              {selectedInfo.child && (
                <>
                  <ChevronRightIcon className="size-3" />
                  {selectedInfo.child.name}
                </>
              )}
              <XIcon className="size-3 hidden group-hover:block" />
            </Badge>
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            문제집{" "}
            {isValidating ? (
              <Loader2Icon className="size-3 animate-spin" />
            ) : (
              `${workBooks?.length ?? 0}개`
            )}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size={"sm"} variant="ghost">
                {
                  sortOptions.find(
                    (option) => option.value === searchParams.sort,
                  )?.label
                }{" "}
                <ChevronDownIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() =>
                    setSearchParams({ ...searchParams, sort: option.value })
                  }
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {workBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ">
            {workBooks.map((book) => (
              <Link href={`/workbooks/${book.id}/preview`} key={book.id}>
                <WorkbookCard workBook={book} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center justify-center flex-1">
            <h2 className="mb-2 text-2xl font-bold">아직 문제집이 없습니다</h2>
            <p className="text-muted-foreground">
              첫 번째 문제집을 만들어보세요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
