import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

function findPackageJson(path: string): string | null {
  const packageJsonPath = join(path, "package.json");
  if (existsSync(packageJsonPath)) {
    return packageJsonPath;
  }
  return null;
}

function isWorkspaceRoot(path: string): boolean {
  const packageJsonPath = findPackageJson(path);
  if (packageJsonPath) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    return packageJson.name === "root";
  }
  return false;
}

export function findWorkspaceRoot(
  path = process.cwd(),
  maxDepth: number = 10,
): string | null {
  if (maxDepth <= 0) {
    return null;
  }
  if (isWorkspaceRoot(path)) {
    return path;
  }
  return findWorkspaceRoot(resolve(path, ".."), maxDepth - 1);
}
