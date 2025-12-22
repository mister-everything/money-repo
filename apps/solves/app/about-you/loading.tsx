import { Loader2Icon } from "lucide-react";

export default function AboutYouLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2Icon className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground">잠시만 기다려주세요...</p>
      </div>
    </div>
  );
}
