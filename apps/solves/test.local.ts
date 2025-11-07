import "@workspace/env";
import { gateway } from "ai";
import { writeFileSync } from "fs";

const availableModels = await gateway.getAvailableModels();

writeFileSync(
  "available-models.json",
  JSON.stringify(availableModels, null, 2),
);

console.dir(availableModels, { depth: null });
