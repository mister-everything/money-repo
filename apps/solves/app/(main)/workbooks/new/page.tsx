"use client";

import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale/ko";
import { useRouter } from "next/navigation";
import { ProbCreateForm } from "@/components/prob-create/prob-create-form";
import { ProbHeader } from "@/components/prob-create/prob-header";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { fetcher } from "@/lib/fetcher";
import { useWorkbookStore } from "@/store/prob-create";

const generateTitle = () => {
  return `${formatDistanceToNow(new Date(), {
    addSuffix: true,
    locale: ko,
  })} 문제집`;
};

export default function ProbCreatePage() {
  const router = useRouter();
  const { setWorkbooks } = useWorkbookStore();

  const handleSubmit = async (data: any) => {
    console.log("문제 생성 데이터:", data);

    // TODO: API 호출 후 생성된 문제집 ID로 이동
    const res = await fetcher<{ id: string }>("/api/workbooks", {
      method: "POST",
      body: JSON.stringify({ title: generateTitle() }),
    });

    setWorkbooks(res.id, data);

    router.push(`/workbooks/${res.id}/edit`);
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
                <ProbCreateForm onSubmit={handleSubmit} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
