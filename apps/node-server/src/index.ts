import { createServer } from "node:http";
import "@workspace/env";
import { createApp } from "./app";

const PORT = process.env.PORT || 5050;

const app = createApp();
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
