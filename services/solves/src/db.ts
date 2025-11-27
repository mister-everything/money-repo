import { IS_PROD } from "@workspace/util/const";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { pgSchema } from "drizzle-orm/pg-core";
import { SCHEMA_NAME } from "./const";
import { createLogger } from "./logger";

const logger = createLogger("solves", "cyan");

if (!process.env.POSTGRES_URL) {
  logger.warn("❌ .env 에 POSTGRES_URL 이 없습니다.");
}

const useLogger = !IS_PROD && false;

export const pgDb = drizzlePg(process.env.POSTGRES_URL!, {
  logger: useLogger,
});

export const solvesSchema = pgSchema(SCHEMA_NAME);
