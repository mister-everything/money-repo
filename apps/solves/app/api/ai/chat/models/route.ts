import { aiPriceService } from "@service/solves";
import { nextOk } from "@/lib/protocol/next-route-helper";

export const revalidate = 600;

export async function GET() {
  const models = await aiPriceService.getActivePrices();

  return nextOk(
    models.map((model) => {
      return {
        provider: model.provider,
        model: model.model,
        displayName: model.displayName,
      };
    }),
  );
}
