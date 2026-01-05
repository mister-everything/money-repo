import { workBookService } from "@service/solves";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InDevelopment } from "@/components/ui/in-development";
import { QuickWorkbookCreator } from "@/components/workbook/quick-workbook-creator";
import { WorkbookCardSimple } from "@/components/workbook/workbook-card";

export default async function Page() {
  const workBooks = await workBookService.searchWorkBooks({
    isPublished: true,
    limit: 3,
  });

  return (
    <div className="p-6 lg:p-10 w-full flex flex-col gap-8">
      <header className="font-semibold text-foreground flex flex-col items-center w-full mt-32">
        <h1 className="mb-4 text-5xl">호기심이 문제가 되는 순간,</h1>
        <h2 className="text-4xl font-bold ">
          Solves<span className="text-5xl text-primary">.</span>
        </h2>
      </header>

      <div className="max-w-4xl w-full mx-auto">
        <div className="flex items-center justify-end">
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
                <WorkbookCardSimple workBook={workBook} />
              </Link>
            );
          })}
        </div>
      </div>
      <QuickWorkbookCreator />
    </div>
  );
}
