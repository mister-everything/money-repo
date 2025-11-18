import { aiPriceService } from "@service/solves";
import { TIME } from "@workspace/util";
import { nextOk } from "@/lib/protocol/next-route-helper";

export const revalidate = TIME.SECONDS(10);

export async function GET() {
  const models = await aiPriceService.getActivePrices();

  console.log(`!!!!current!`);

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
