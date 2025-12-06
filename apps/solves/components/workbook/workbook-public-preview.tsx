"use client";

import { WorkBookWithoutAnswer } from "@service/solves/shared";

import { cn } from "@/lib/utils";

import { Block } from "./block/block";

import { WorkbookHeader } from "./workbook-header";

export function WorkbookPublicPreview({
  book: { blocks, ...workbook },
}: {
  book: WorkBookWithoutAnswer;
}) {
  return (
    <div className="h-full relative">
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
