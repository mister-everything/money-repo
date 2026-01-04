import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex w-full h-screen">
      <div className="absolute left-0 bottom-0 w-full bg-linear-to-b from-transparent to-primary/10 h-1/3" />
      <div className="flex-1">
        {/* 뒤로가기 버튼 */}
        <div className="w-full p-4 sticky top-0 z-10">
          <Skeleton className="h-9 w-24" />
        </div>

        {/* 메인 컨텐츠 */}
        <div className="max-w-5xl mx-auto pb-24 px-4 sm:px-6">
          {/* 헤더 */}
          <div className="py-8 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-96" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-7 w-20" />
              </div>
            </div>
            {/* 태그 */}
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-sm" />
              <Skeleton className="h-6 w-20 rounded-sm" />
              <Skeleton className="h-6 w-14 rounded-sm" />
            </div>
          </div>

          {/* 탭 */}
          <div className="mb-6">
            <div className="grid w-full grid-cols-3 h-12 gap-1">
              <Skeleton className="h-full rounded-md" />
              <Skeleton className="h-full rounded-md" />
              <Skeleton className="h-full rounded-md" />
            </div>
          </div>

          {/* 통계 카드 4개 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Skeleton className="h-[110px] rounded-xl" />
            <Skeleton className="h-[110px] rounded-xl" />
            <Skeleton className="h-[110px] rounded-xl" />
            <Skeleton className="h-[110px] rounded-xl" />
          </div>

          {/* 일자별 풀이 추이 차트 */}
          <Skeleton className="h-[280px] w-full rounded-xl mb-6" />

          {/* 점수 분포 + 가장 어려운 문제 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[320px] rounded-xl" />
            <Skeleton className="h-[320px] rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

