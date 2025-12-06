"use client";

import { WorkBookWithoutAnswer } from "@service/solves/shared";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Block } from "./block/block";
import { WorkbookHeader } from "./workbook-header";

export function WorkbookPublicPreview({
  book: { blocks, ...workbook },
}: {
  book: WorkBookWithoutAnswer;
}) {
  return (
    <div className="h-full relative">
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 mx-auto ">
        <Link href={`/workbooks/${workbook.id}/solve`}>
          <Button
            size="lg"
            variant={"outline"}
            className="border-2 py-6 w-full lg:w-lg rounded-full bg-primary/5 text-primary border-primary backdrop-blur-sm font-bold text-lg hover:bg-primary hover:text-primary-foreground"
          >
            문제집 풀러가기
          </Button>
        </Link>
      </div>
      <div className="h-full overflow-y-auto relative">
        <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-24 pt-6">
          <WorkbookHeader
            className="shadow-none"
            mode={"solve"}
            book={workbook}
          />

          {blocks.map((b, index) => {
            return (
              <div
                key={b.id}
                className={cn(
                  "relative transition-all duration-200 rounded-xl",
                )}
              >
                <Block
                  index={index}
                  mode={"solve"}
                  type={b.type}
                  question={b.question ?? ""}
                  id={b.id}
                  order={b.order}
                  content={b.content}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
