import { GoBackButton } from "@/components/layouts/go-back-button";

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen relative">
      <div className="p-4 absolute inset-0 z-10 h-fit w-full">
        <GoBackButton href="/">홈으로</GoBackButton>
      </div>
      {children}
    </div>
  );
}
