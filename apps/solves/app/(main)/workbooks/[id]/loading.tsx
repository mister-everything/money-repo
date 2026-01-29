import { BaseContainer } from "@/components/layouts/base-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col w-full py-14">
      <BaseContainer>
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
      </BaseContainer>
    </div>
  );
}
