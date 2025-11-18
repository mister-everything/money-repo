import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { SERVICE_NAME } from "./const";

if (!process.env.POSTGRES_URL) {
  console.warn(`⚠️ [${SERVICE_NAME}] .env 에 POSTGRES_URL 이 없습니다.`);
}

export const pgDb = drizzlePg(process.env.POSTGRES_URL!);
