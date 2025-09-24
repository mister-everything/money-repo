import Link from "next/link";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative w-full flex flex-col h-screen">
      <div className="flex-1 flex flex-col gap-4 p-4 md:p-6">
        <Link className="text-xl font-bold" href="/">
          DashBoard
        </Link>
        <div className="w-full flex-1">{children}</div>
      </div>
    </main>
  );
}
