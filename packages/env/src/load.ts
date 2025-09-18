import { existsSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

export const load = <T extends Record<string, string> = Record<string, string>>(
  root: string = process.cwd(),
): T => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[ENV] Loading environment variables from ${root}`);
  }
  const localEnv = join(root, ".env.local");
  const modeEnv = join(root, `.env.${process.env.NODE_ENV}`);
  const defaultEnv = join(root, ".env");

  const loadedVars = [localEnv, modeEnv, defaultEnv].reduce<T>((prev, path) => {
    const variables = !existsSync(path) ? {} : (config({ path }).parsed ?? {});
    Object.entries(variables).forEach(([key, value]) => {
      if (!Object.prototype.hasOwnProperty.call(prev, key)) {
        Object.assign(prev, { [key]: value });
        // process.env에도 설정
        process.env[key] = value;
      }
    });
    return prev;
  }, {} as T);

  return loadedVars;
};
