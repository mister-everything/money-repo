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
    table: "todo_drizzle",
    schema: "todo-app",
  },
  dbCredentials: {
    url,
  },
});
