import "@workspace/env";
import { gateway } from "ai";

const availableModels = await gateway.getAvailableModels();

console.dir(availableModels, { depth: null });
