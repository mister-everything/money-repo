"use server";

if (process.env.NODE_ENV != "production") {
  console.log(`LOAD GLOBAL ENV`);
}

import path from "path";
import { fileURLToPath } from "url";
import { load } from "../load";

const currentPaths = path.dirname(fileURLToPath(import.meta.url));
load(currentPaths);
