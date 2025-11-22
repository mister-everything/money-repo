import { readdirSync, statSync } from "fs";
import { join } from "path";
import { rimraf } from "rimraf";

async function findAndRemoveRecursively(targetDirs: string[], basePath = ".") {
  try {
    const items = readdirSync(basePath);

    for (const item of items) {
      const fullPath = join(basePath, item);
      const stats = statSync(fullPath);

      // 목표 디렉토리와 일치하면 삭제
      if (targetDirs.includes(item)) {
        await rimraf(fullPath);
        console.log(`✅ Removed ${fullPath}`);
        // ✨ 중요: 삭제했으면 그 아래로 가지 말고 continue!
        continue;
      }

      // 디렉토리면 재귀적으로 탐색
      // ✨ 중요: 삭제 대상 폴더는 아예 탐색하지 않음
      if (stats.isDirectory() && !targetDirs.includes(item)) {
        await findAndRemoveRecursively(targetDirs, fullPath);
      }
    }
  } catch (error: any) {
    if (error.code !== "EACCES") {
      console.warn(`⚠️  Warning in ${basePath}: ${error.message}`);
    }
  }
}

async function clean(dirsToClean?: string[]) {
  try {
    console.log("🧹 Cleaning up recursively...\n");

    const defaultDirs = [".next", "node_modules", ".turbo", "pnpm-lock.yaml"];
    const dirs =
      dirsToClean && dirsToClean.length > 0 ? dirsToClean : defaultDirs;

    console.log(`Searching for: ${dirs.join(", ")}\n`);

    await findAndRemoveRecursively(dirs);

    console.log("\n✨ Cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
clean(args);
