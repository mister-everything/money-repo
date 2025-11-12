import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { pgSchema } from "drizzle-orm/pg-core";
import { SCHEMA_NAME } from "./const";

if (!process.env.POSTGRES_URL) {
  console.warn(`❌ .env 에 POSTGRES_URL 이 없습니다.`);
}

export const pgDb = drizzlePg(process.env.POSTGRES_URL!);

export const solvesSchema = pgSchema(SCHEMA_NAME);
