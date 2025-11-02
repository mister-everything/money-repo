import { GoBackButton } from "@/components/layouts/go-back-button";

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen">
      <div className="p-4">
        <GoBackButton>뒤로가기</GoBackButton>
      </div>

      <div className="p-4 w-full mx-auto max-w-5xl">
        <div className="space-y-6 ">
          <h1 className="text-center text-3xl font-semibold py-6">
            함께 성장하는 요금제
          </h1>
          {children}
        </div>
      </div>
    </div>
  );
}
