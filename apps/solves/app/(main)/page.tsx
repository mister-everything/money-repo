import { categoryService, workBookService } from "@service/solves";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InDevelopment } from "@/components/ui/in-development";
import { QuickWorkbookCreator } from "@/components/workbook/quick-workbook-creator";
import { WorkbookCard } from "@/components/workbook/workbook-card";

export default async function Page() {
  const workBooks = await workBookService.searchWorkBooks({
    isPublished: true,
    limit: 3,
  });
  const categories = await categoryService.getAllCategoriesWithSubs();

  return (
    <div className="p-6 lg:p-10 w-full flex flex-col gap-8">
      <div className="text-3xl font-bold text-foreground">
        <h1 className="mb-2">다양한 상황에 따라</h1>
        <h1>원하는 문제를 출제하고 활용해보세요</h1>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground mb-4">
            전체 베스트
          </h2>
          <Link href="/workbooks">
            <Button variant="ghost">
              더 많은 문제집
              <ChevronRightIcon />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => {
            const workBook = workBooks[index];
            if (!workBook)
              return (
                <InDevelopment className="w-full h-full" key={index}>
                  아직 없네요 🤔
                </InDevelopment>
              );

            return (
              <Link
                href={`/workbooks/${workBook.id}/preview`}
                key={workBook.id}
              >
                <WorkbookCard workBook={workBook} />
              </Link>
            );
          })}
        </div>
      </div>
      <QuickWorkbookCreator categories={categories} />
    </div>
  );
}
