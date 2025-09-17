import { migrate } from "drizzle-orm/node-postgres/migrator";
import "@workspace/env";
import { join } from "path";
import { pgDb } from "./db";

const runMigrate = async () => {
  console.log("⏳ [TODO Service] Running PostgreSQL migrations...");

  const start = Date.now();
  await migrate(pgDb, {
    migrationsFolder: join(process.cwd(), "src/migrations"),
  }).catch((err) => {
    console.error(
      `❌ [TODO Service] PostgreSQL migrations failed. check the postgres instance is running.`,
      err.cause,
    );
    throw err;
  });
  const end = Date.now();

  console.log(
    "✅ [TODO Service] PostgreSQL migrations completed in",
    end - start,
    "ms",
  );
  process.exit(0);
};

runMigrate();
