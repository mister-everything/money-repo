import { migrate } from "drizzle-orm/node-postgres/migrator";
import "@workspace/env";
import { pgDb } from "./db";

async function main() {
  console.log("🏃‍♂️ Running migrations...");

  await migrate(pgDb, {
    migrationsFolder: "./src/migrations",
  });

  console.log("✅ Migrations completed!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed!");
  console.error(err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Gracefully shutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n👋 Gracefully shutting down...");
  process.exit(0);
});
