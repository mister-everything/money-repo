import { Tool } from "ai";

type ToolBranch = Tool | ToolTree;
type ToolTree = { [key: string]: ToolBranch };

function isTool(value: ToolBranch): value is Tool {
  return (
    typeof value === "object" &&
    value !== null &&
    "execute" in value &&
    typeof value.execute === "function"
  );
}

export function flattenToolTree(tree: ToolTree, path: string[] = []): Record<string, Tool> {
  const entries: Array<[string, Tool]> = [];

  for (const [key, branch] of Object.entries(tree)) {
    const nextPath = [...path, key];
    if (isTool(branch)) {
      entries.push([nextPath.join("."), branch]);
      continue;
    }
    entries.push(...Object.entries(flattenToolTree(branch, nextPath)));
  }

  return Object.fromEntries(entries);
}
