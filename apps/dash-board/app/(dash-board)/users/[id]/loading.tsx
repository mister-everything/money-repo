import { Skeleton } from "@/components/ui/skeleton";

export default function UserDetailLoading() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Information Card */}
        <Skeleton className="w-full h-96" />

        {/* Role Management Card */}
        <Skeleton className="w-full h-96" />

        {/* Ban Status Card */}
        <Skeleton className="w-full h-64 md:col-span-2" />
      </div>
    </div>
  );
}
