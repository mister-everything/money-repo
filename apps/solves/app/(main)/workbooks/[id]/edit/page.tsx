"use client";

import { use } from "react";
import { Button } from "@/components/ui/button";
import { InDevelopment } from "@/components/ui/in-development";
import { WorkbooksCreateChat } from "@/components/workbook/create-chatbot";

export default function ProbEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col w-3/4 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="mb-8 space-y-4">
                <div>
                  <h1 className="mb-2 text-2xl font-bold text-foreground">
                    문제집 제목
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    문제집 한줄 설명 어쩌구
                  </p>
                </div>
              </div>
              <InDevelopment className="h-96" />

              <div className="mt-8 flex justify-end">
                <Button
                  size="lg"
                  className="rounded-lg w-full"
                  onClick={() => console.log("전체 미리보기")}
                >
                  전체 미리보기
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Resizable Chat Panel */}
        <div className="w-1/4">
          <WorkbooksCreateChat threadId={id} workbookId={id} />
        </div>
        {/* <ResizableChatPanel /> */}
      </div>
    </div>
  );
}
