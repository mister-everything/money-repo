import { LandingNavbar } from "@/components/layouts/landing-navbar";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <LandingNavbar />
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
