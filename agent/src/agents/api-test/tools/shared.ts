import { createFbStorage } from "@workspace/fb-storage";
import { join } from "path";
import type { TestResult } from "../types";

const DIR_PATH = join(process.cwd(), "node_modules", "@local-agent");
const FILE_PATH = join(DIR_PATH, "api-test-results.json");

export const storage = createFbStorage<TestResult[]>(FILE_PATH);
