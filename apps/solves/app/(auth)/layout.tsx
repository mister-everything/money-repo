import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative w-full flex flex-col h-screen">
      <div className="flex-1 flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <Link className="text-xl font-bold" href="/">
            Solves
            <span className="text-primary text-2xl">.</span>
          </Link>
          <ThemeToggle />
        </div>
        <div className="w-full flex-1">{children}</div>
      </div>
    </main>
  );
}
