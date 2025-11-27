import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { logger } from "./logger";

if (!process.env.POSTGRES_URL) {
  logger.warn("⚠️ .env 에 POSTGRES_URL 이 없습니다.");
}

export const pgDb = drizzlePg(process.env.POSTGRES_URL!);
