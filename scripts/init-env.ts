import { existsSync, readFileSync, writeFileSync } from "fs";
import { glob } from "glob";
import { dirname, join } from "path";

async function initEnv() {
  try {
    console.log("🔍 Searching for .env.example files...");

    // Find all .env.example files in the monorepo
    const envExampleFiles = await glob("**/.env.example", {
      cwd: process.cwd(),
      ignore: ["node_modules/**", ".git/**", ".next/**", ".turbo/**"],
    });

    if (envExampleFiles.length === 0) {
      console.log("ℹ️  No .env.example files found in the monorepo");
      return;
    }

    console.log(`📁 Found ${envExampleFiles.length} .env.example file(s):`);

    for (const envExampleFile of envExampleFiles) {
      const fullPath = join(process.cwd(), envExampleFile);
      const dir = dirname(fullPath);
      const envFile = join(dir, ".env");

      console.log(`  - ${envExampleFile}`);

      // Check if .env already exists
      if (existsSync(envFile)) {
        continue;
      }

      try {
        // Read .env.example content
        const content = readFileSync(fullPath, "utf-8");

        // Write to .env
        writeFileSync(envFile, content, "utf-8");
        console.log(`    ✅ Created .env from .env.example`);
      } catch (error) {
        console.error(`    ❌ Error processing ${envExampleFile}:`, error);
      }
    }

    console.log("✨ Environment initialization completed!");
  } catch (error) {
    console.error("❌ Error during environment initialization:", error);
    process.exit(1);
  }
}

initEnv();
