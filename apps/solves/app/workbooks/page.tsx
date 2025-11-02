import { Skeleton } from "@/components/ui/skeleton";

/**
 * 문제 풀이 메인 화면
 */
export default function WorkbooksPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold my-6">어떤 문제집을 풀고싶나요?</h1>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="w-48 h-6" />
            <div className="flex gap-2">
              <Skeleton className="w-18 h-12" />
              <Skeleton className="w-24 h-12" />
              <Skeleton className="w-18 h-12" />
              <Skeleton className="w-18 h-12 ml-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
