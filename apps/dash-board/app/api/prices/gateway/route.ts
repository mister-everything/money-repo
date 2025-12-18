import { gateway } from "ai";
import { NextResponse } from "next/server";

export async function GET() {
  const gatewayResponse = await gateway.getAvailableModels();
  return NextResponse.json(
    gatewayResponse.models.map((v) => {
      return {
        ...v,
        value: `${v.name}`,
      };
    }),
  );
}
