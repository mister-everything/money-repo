import { Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>
      </div>

      {/* Search Card */}
      <Skeleton className="w-full h-40" />

      {/* Users Table Card */}
      <Skeleton className="w-full h-96" />
    </div>
  );
}
