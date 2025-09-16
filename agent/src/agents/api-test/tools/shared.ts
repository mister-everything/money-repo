import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { TestResult } from "../types";

const DIR_PATH = join(process.cwd(), "node_modules", "@local-agent");
const FILE_PATH = join(DIR_PATH, "api-test-results.json");

export const saveResults = (results: TestResult[]) => {
  mkdirSync(DIR_PATH, { recursive: true });
  writeFileSync(FILE_PATH, JSON.stringify(results, null, 2));
};

export const getResults = (): TestResult[] => {
  if (!existsSync(FILE_PATH)) {
    return [];
  }
  const data = readFileSync(FILE_PATH, "utf-8");
  return JSON.parse(data) as TestResult[];
};
