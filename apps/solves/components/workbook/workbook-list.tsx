"use client";
import { WorkBookWithoutBlocks } from "@service/solves/shared";
import { isNull } from "@workspace/util";
import { ChevronDownIcon, LightbulbIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import z from "zod";
import { SearchWorkbooksRequest } from "@/app/api/workbooks/types";
import { useCategories } from "@/hooks/query/use-categories";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { InDevelopment } from "../ui/in-development";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { WorkbookCard } from "./workbook-card";

const sortOptions = [
  { label: "인기순", value: "popular" },
  { label: "최신순", value: "latest" },
  { label: "평균 점수 높은순", value: "highest" },
  { label: "평균 점수 낮은순", value: "lowest" },
] as const;

export function WorkbookList({
  initialWorkBooks = [],
}: {
  initialWorkBooks: WorkBookWithoutBlocks[];
}) {
  const [searchParams, setSearchParams] = useState<
    z.infer<typeof SearchWorkbooksRequest>
  >({
    page: 1,
    limit: 30,
    search: "",
    sort: "latest",
    categoryMainIds: [],
    categorySubIds: [],
  });

  const { data: categories, isLoading: isCategoriesLoading } = useCategories();

  const [currentCategory, setCurrentCategory] = useState<number>();

  const subCategories = useMemo(() => {
    if (isNull(currentCategory)) return null;
    const category = categories?.find(
      (category) => category.id === currentCategory,
    );
    if (isNull(category)) return null;
    return category.subs;
  }, [currentCategory]);

  const { data: workBooks, isValidating } = useSWR(
    // `/api/workbooks?${new URLSearchParams(JSON.stringify(searchParams)).toString()}`,
    `/api/workbooks`,
    {
      fallbackData: initialWorkBooks,
      revalidateOnFocus: false,
      revalidateOnMount: false,
    },
  );

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
        <div className="flex overflow-x-auto gap-0.5 py-2">
          {isCategoriesLoading ? (
            <Skeleton className="w-full h-26" />
          ) : categories?.length ? (
            categories.map((category) => (
              <div
                key={category.id}
                onClick={() => setCurrentCategory(category.id)}
                className={cn(
                  "flex flex-col items-center gap-2 py-3.5 justify-center min-w-28 cursor-pointer",
                  "hover:bg-secondary/50 rounded-md",
                  currentCategory === category.id && "bg-secondary",
                )}
              >
                <Button className="size-12!">
                  <LightbulbIcon />
                </Button>
                <span className="text-sm font-bold">{category.name}</span>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 justify-center w-full h-26">
              <span className="text-sm font-bold">카테고리가 없습니다</span>
            </div>
          )}
        </div>
        {currentCategory && (
          <div className="flex flex-wrap items-center gap-2 w-full mb-4">
            <Badge
              variant="secondary"
              className="rounded-full cursor-pointer py-1.5 hover:bg-primary/5 hover:border-primary transition-all"
            >
              전체
            </Badge>
            {subCategories?.map((subCategory) => (
              <Badge
                key={subCategory.id}
                variant="secondary"
                className="rounded-full cursor-pointer py-1.5 hover:bg-primary/5 hover:border-primary transition-all"
              >
                {subCategory.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 bg-secondary/40 border-t p-6 lg:p-10 flex-1">
        <div>
          <InDevelopment className="w-full h-16">
            선택된 카테고리 목록 ...
          </InDevelopment>
        </div>
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
