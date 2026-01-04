import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function PolicyFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Link
          className="hover:underline hover:text-foreground"
          href="/policies/terms"
          target="_blank"
        >
          이용약관
        </Link>
        <div className="h-3">
          <Separator orientation="vertical" />
        </div>
        <Link
          className="hover:underline hover:text-foreground"
          href="/policies/privacy"
          target="_blank"
        >
          개인정보 처리방침
        </Link>
      </div>
      <p>
        © {currentYear}{" "}
        <span className="font-semibold text-foreground">Solves</span>
        <span className="text-primary text-lg">.</span> All rights reserved.
      </p>
    </footer>
  );
}
