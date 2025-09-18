import { defineConfig } from "drizzle-kit";
import "@workspace/env";

const dialect = "postgresql";

// @ts-ignore
const url = process.env.POSTGRES_URL!;

const schema = "./src/schema.ts";

const out = "./src/migrations";

export default defineConfig({
  schema,
  out,
  dialect,
  migrations: {
    schema: "auth-app",
  },
  dbCredentials: {
    url,
  },
});
