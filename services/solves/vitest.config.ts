import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__test__/setup.ts"],
    include: ["src/**/*.test.ts"],
  },
});
