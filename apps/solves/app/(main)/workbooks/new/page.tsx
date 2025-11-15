"use client";

import { useState } from "react";
import { ProbCreateForm } from "@/components/prob-create/prob-create-form";
import { ProbHeader } from "@/components/prob-create/prob-header";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { generateProbBook } from "@/lib/prob/generator";
import type { ProbGenerationFormData } from "@/lib/prob/schemas";
import { useProbCreateStore } from "@/store/prob-create";

export default function ProbCreatePage() {
  const { setFormData } = useProbCreateStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ProbGenerationFormData) => {
    console.log("[ProbCreatePage] 폼 제출 데이터:", data);
    if (isSubmitting) return;
    setFormData(data);
    setIsSubmitting(true);

    try {
      const response = await generateProbBook({ form: data });
      console.log("[ProbCreatePage] 문제 생성 결과 probBook:", response.probBook);
      console.log("[ProbCreatePage] 문제 생성 결과 metadata:", response.metadata);
      // TODO: 생성된 문제집 결과를 UI에 연결하고, 이후 편집 페이지로 라우팅
    } catch (error) {
      console.error("[ProbCreatePage] 문제 생성 중 오류 발생:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen flex-col relative">
      <ProbHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Panel - Form */}
        <div className="overflow-y-auto w-full ml-10 mr-10">
          <div className="p-6">
            <Tabs defaultValue="create" className="w-full">
              <div className="mb-4 flex justify-start items-center gap-4">
                <h1 className="text-2xl font-semibold text-foreground">
                  어떤 문제집을 만들고 싶나요?
                </h1>
                <p className="text-sm text-muted-foreground">
                  (* 한 문제집은 총 10개의 문제로 구성됩니다.)
                </p>
              </div>

              <TabsContent value="create">
                <ProbCreateForm
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
