import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";

// Mock 설정
vi.mock("@service/todo-service", () => ({
  todoService: {
    findAll: vi.fn(),
    findById: vi.fn(),
    save: vi.fn(),
    deleteById: vi.fn(),
  },
  todoSaveSchema: {
    parse: vi.fn(),
  },
}));

vi.mock("@workspace/util", () => ({
  generateUUID: vi.fn(() => "test-uuid-123"),
}));

describe("Express Server", () => {
  let app: any;
  beforeEach(() => {
    app = createApp();
    vi.clearAllMocks();
  });

  describe("기본 라우트", () => {
    it("GET / - Hello 메시지 반환", async () => {
      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.text).toBe("Hello!test-uuid-123");
    });
  });

  describe("Todo API", () => {
    it("GET /todo - 모든 todo 조회", async () => {
      const { todoService } = await import("@service/todo-service");

      const mockTodos = [
        {
          id: 1,
          title: "Test Todo",
          description: "Test",
          done: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(todoService.findAll).mockResolvedValue(mockTodos);

      const response = await request(app).get("/todo");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: 1,
        title: "Test Todo",
        description: "Test",
        done: false,
      });
      expect(response.body[0].createdAt).toBeDefined();
      expect(response.body[0].updatedAt).toBeDefined();
    });

    it("POST /todo - 새 todo 생성", async () => {
      const { todoService, todoSaveSchema } = await import(
        "@service/todo-service"
      );

      const newTodo = { title: "New Todo", description: "New", done: false };
      const savedTodo = {
        id: 1,
        ...newTodo,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(todoSaveSchema.parse).mockReturnValue(newTodo);
      vi.mocked(todoService.save).mockResolvedValue(savedTodo);

      const response = await request(app).post("/todo").send(newTodo);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        title: "New Todo",
        description: "New",
        done: false,
      });
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it("GET /todo/:id - 특정 todo 조회", async () => {
      const { todoService } = await import("@service/todo-service");

      const mockTodo = {
        id: 1,
        title: "Test",
        description: "Test",
        done: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(todoService.findById).mockResolvedValue(mockTodo);

      const response = await request(app).get("/todo/1");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        title: "Test",
        description: "Test",
        done: false,
      });
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it("DELETE /todo/:id - todo 삭제", async () => {
      const { todoService } = await import("@service/todo-service");

      vi.mocked(todoService.deleteById).mockResolvedValue(undefined);

      const response = await request(app).delete("/todo/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Todo deleted" });
    });
  });

  describe("에러 처리", () => {
    it("존재하지 않는 라우트 - 404", async () => {
      const response = await request(app).get("/unknown");
      expect(response.status).toBe(404);
    });

    it("잘못된 JSON - 400", async () => {
      const response = await request(app)
        .post("/todo")
        .set("Content-Type", "application/json")
        .send("invalid json");

      expect(response.status).toBe(400);
    });
  });
});
