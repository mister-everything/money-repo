import { createServer } from "node:http";
import { generateUUID } from "@workspace/util";
import express from "express";
import "@workspace/env";

const PORT = process.env.PORT || 5050;

const app = express();

const serverId = generateUUID();

app.get("/", (req, res) => res.send("Hello!" + serverId));

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
