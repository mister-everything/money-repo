import { Skeleton } from "@/components/ui/skeleton";

export default function ProbEditLoading() {
  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="mb-8 space-y-4">
                <div>
                  <Skeleton className="mb-2 h-8 w-64" />

                  <Skeleton className="h-4 w-96" />
                </div>
              </div>

              <div className="space-y-4">
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
