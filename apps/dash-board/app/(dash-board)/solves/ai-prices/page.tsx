import { aiPriceAdminService } from "@service/solves";
import { AIPriceTable } from "@/components/solves/ai-price-table";
import { AIPricesClient } from "./ai-prices-client";

export const dynamic = "force-dynamic";

export default async function AIPricesPage() {
  const prices = await aiPriceAdminService.getAllPrices();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI 가격 관리</h1>
          <p className="text-muted-foreground mt-1">
            AI 모델별 원가 및 마진을 관리합니다.
          </p>
        </div>
        <AIPricesClient />
      </div>

      <AIPriceTable prices={prices} />
    </main>
  );
}
