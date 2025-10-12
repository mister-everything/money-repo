import { defineConfig } from "drizzle-kit";
import "@workspace/env";

const dialect = "postgresql";

// @ts-ignore
const url = process.env.POSTGRES_URL!;

const out = "./src/migrations";

export default defineConfig({
  out,
  dialect,
  dbCredentials: {
    url,
  },
});
