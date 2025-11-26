import { migrate } from "drizzle-orm/node-postgres/migrator";
import "@workspace/env";
import { join } from "path";
import { SCHEMA_NAME } from "./const";
import { pgDb } from "./db";
import { log } from "./logger";

export const runMigrate = async () => {
  log.info("⏳ Running PostgreSQL migrations...");

  const start = Date.now();
  await migrate(pgDb, {
    migrationsFolder: join(process.cwd(), "src/migrations"),
    migrationsSchema: SCHEMA_NAME,
  }).catch((err) => {
    log.error(
      "❌ PostgreSQL migrations failed. check the postgres instance is running.",
      err.cause,
    );
    throw err;
  });
  const end = Date.now();

  log.info(
    `✅ PostgreSQL migrations completed in ${end - start}ms`,
  );
  process.exit(0);
};

runMigrate();
