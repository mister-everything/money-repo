"use client";

export default function CompletedWorkbooksPage() {
  return (
    <div className="flex h-screen flex-col relative">
      <div className="flex flex-1 overflow-hidden">
        <div className="overflow-y-auto w-full ml-10 mr-10">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-foreground">
              다 푼 문제집을 확인해보세요.
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
