import { IS_PROD } from "@workspace/util/const";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { pgSchema } from "drizzle-orm/pg-core";
import { SCHEMA_NAME, SERVICE_NAME } from "./const";

if (!process.env.POSTGRES_URL) {
  console.warn(`❌ .env 에 POSTGRES_URL 이 없습니다.`);
} else if (!IS_PROD) {
  console.log(`[${SERVICE_NAME}] POSTGRES_URL: ${process.env.POSTGRES_URL}`);
}

export const pgDb = drizzlePg(process.env.POSTGRES_URL!);

export const solvesSchema = pgSchema(SCHEMA_NAME);
