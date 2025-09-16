import { todoSaveSchema, todoService } from "@service/todo-service";
import { generateUUID } from "@workspace/util";
import express from "express";

export const createApp = (): express.Application => {
  const app = express();
  app.use(express.json());

  const serverId = generateUUID();

  app.get("/", (req, res) => res.send("Hello!" + serverId));

  app.get("/todo", async (req, res) => {
    try {
      const todos = await todoService.findAll();
      res.json(todos);
    } catch (error) {
      console.error("Error fetching todos:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/todo", async (req, res) => {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "Request body is required" });
      }
      const todo = await todoService.save(todoSaveSchema.parse(req.body));
      res.json(todo);
    } catch (error) {
      console.error("Error creating todo:", error);
      if (error instanceof Error && error.name === "ZodError") {
        res
          .status(400)
          .json({ error: "Validation error", details: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.get("/todo/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      const todo = await todoService.findById(id);
      res.json(todo);
    } catch (error) {
      console.error("Error fetching todo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/todo/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      await todoService.deleteById(id);
      res.json({ message: "Todo deleted" });
    } catch (error) {
      console.error("Error deleting todo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return app;
};
