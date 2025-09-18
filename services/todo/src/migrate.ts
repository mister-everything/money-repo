import { migrate } from "drizzle-orm/node-postgres/migrator";
import "@workspace/env";
import { join } from "path";
import { SCHEMA_NAME, SERVICE_NAME } from "./const";
import { pgDb } from "./db";

const runMigrate = async () => {
  console.log(`⏳ [${SERVICE_NAME}] Running PostgreSQL migrations...`);

  const start = Date.now();
  await migrate(pgDb, {
    migrationsFolder: join(process.cwd(), "src/migrations"),
    migrationsSchema: SCHEMA_NAME,
  }).catch((err) => {
    console.error(
      `❌ [${SERVICE_NAME}] PostgreSQL migrations failed. check the postgres instance is running.`,
      err.cause,
    );
    throw err;
  });
  const end = Date.now();

  console.log(
    `✅ [${SERVICE_NAME}] PostgreSQL migrations completed in`,
    `${end - start}ms`,
    "ms",
  );
  process.exit(0);
};

runMigrate();
