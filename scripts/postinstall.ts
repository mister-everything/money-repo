// import { execSync } from "child_process";
// import { join } from "path";

async function postinstall() {
  try {
    console.log("🚀 Running postinstall tasks...");

    // // Run init-env script
    // console.log("📋 Initializing environment files...");
    // const initEnvScript = join(__dirname, "init-env.ts");

    // execSync(`tsx ${initEnvScript}`, {
    //   stdio: "inherit",
    //   cwd: process.cwd(),
    // });

    console.log("✅ Postinstall tasks completed successfully!");
  } catch (error) {
    console.error("❌ Error during postinstall:", error);
    process.exit(1);
  }
}

postinstall();
