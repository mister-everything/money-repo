import { createServer } from "node:http";
import { generateUUID } from "@workspace/util";
import express from "express";
import "@workspace/env";
import { todoSaveSchema, todoService } from "@service/todo-service";

const PORT = process.env.PORT || 5050;

const app = express();

const serverId = generateUUID();

app.get("/", (req, res) => res.send("Hello!" + serverId));

app.get("/todo", async (req, res) => {
  const todos = await todoService.findAll();
  res.json(todos);
});

app.post("/todo", async (req, res) => {
  const todo = await todoService.save(todoSaveSchema.parse(req.body));
  res.json(todo);
});

app.delete("/todo/:id", async (req, res) => {
  await todoService.deleteById(Number(req.params.id));
  res.json({ message: "Todo deleted" });
});

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
