import { aiPriceService } from "@service/solves";
import { gateway } from "ai";
import { AIPriceTable } from "@/components/solves/ai-price-table";
import { logger } from "@/lib/logger";
import { AIPricesClient } from "./ai-prices-client";
export const dynamic = "force-dynamic";

export default async function AIPricesPage() {
  const prices = await aiPriceService.getAllPrices().catch((e) => {
    logger.error(e);
    return [];
  });

  const currentOutCredit = await gateway.getCredits();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground mt-1">
            AI 모델별 원가 및 마진을 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground">현재 잔액</span>
            <span className="font-semibold">
              ${Number(currentOutCredit.balance).toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground">
              총 우리가 결제한 금액
            </span>
            <span className="font-semibold">
              ${Number(currentOutCredit.totalUsed).toFixed(2)}
            </span>
          </div>
          <AIPricesClient />
        </div>
      </div>

      <AIPriceTable prices={prices} />
    </main>
  );
}
