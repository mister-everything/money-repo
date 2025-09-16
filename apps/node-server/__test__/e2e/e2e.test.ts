import request from "supertest";
import { describe, expect, it } from "vitest";

// 실제 서버 URL (start-server-and-test가 띄운 서버)
const BASE_URL = "http://localhost:5050";

describe("E2E Tests - Real Server", () => {
  describe("서버 상태 확인", () => {
    it("서버가 정상적으로 실행되고 있는지 확인", async () => {
      const response = await request(BASE_URL).get("/");

      expect(response.status).toBe(200);
      expect(response.text).toContain("Hello!");
    });
  });

  describe("Todo API E2E 테스트", () => {
    it("GET /todo - 모든 todo 조회", async () => {
      const response = await request(BASE_URL).get("/todo");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // 기존 데이터가 있을 수 있으므로 길이 검증은 하지 않음
    });

    it("POST /todo - 새 todo 생성", async () => {
      const newTodo = {
        title: "E2E Test Todo",
        description: "E2E 테스트용 todo",
        done: false,
      };

      const response = await request(BASE_URL).post("/todo").send(newTodo);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        title: "E2E Test Todo",
        description: "E2E 테스트용 todo",
        done: false,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it("전체 CRUD 워크플로우 테스트", async () => {
      // 1. 새 todo 생성
      const newTodo = {
        title: "CRUD Test Todo",
        description: "CRUD 테스트용 todo",
        done: false,
      };

      const createResponse = await request(BASE_URL)
        .post("/todo")
        .send(newTodo);

      expect(createResponse.status).toBe(200);
      const createdTodo = createResponse.body;
      expect(createdTodo.id).toBeDefined();

      // 2. 생성된 todo 조회
      const getResponse = await request(BASE_URL).get(
        `/todo/${createdTodo.id}`,
      );
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.id).toBe(createdTodo.id);
      expect(getResponse.body.title).toBe("CRUD Test Todo");

      // 3. 모든 todo 조회 (기존 데이터 + 새로 생성된 데이터)
      const getAllResponse = await request(BASE_URL).get("/todo");
      expect(getAllResponse.status).toBe(200);
      expect(Array.isArray(getAllResponse.body)).toBe(true);
      expect(getAllResponse.body.length).toBeGreaterThan(0);

      // 4. todo 업데이트 (POST로 upsert)
      const updatedTodo = {
        id: createdTodo.id,
        title: "Updated CRUD Test Todo",
        description: "업데이트된 CRUD 테스트용 todo",
        done: true,
      };

      const updateResponse = await request(BASE_URL)
        .post("/todo")
        .send(updatedTodo);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.title).toBe("Updated CRUD Test Todo");
      expect(updateResponse.body.done).toBe(true);

      // 5. todo 삭제
      const deleteResponse = await request(BASE_URL).delete(
        `/todo/${createdTodo.id}`,
      );
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe("Todo deleted");

      // 6. 삭제 확인
      const getAfterDeleteResponse = await request(BASE_URL).get(
        `/todo/${createdTodo.id}`,
      );
      expect(getAfterDeleteResponse.status).toBe(200);
      // 삭제된 todo는 null 또는 빈 문자열로 반환될 수 있음
      expect(
        getAfterDeleteResponse.body === null ||
          getAfterDeleteResponse.body === "",
      ).toBe(true);
    });

    it("여러 todo 동시 처리", async () => {
      // 여러 todo 생성
      const todos = [
        { title: "Todo 1", description: "첫 번째 todo", done: false },
        { title: "Todo 2", description: "두 번째 todo", done: true },
        { title: "Todo 3", description: "세 번째 todo", done: false },
      ];

      const createdTodos: any[] = [];
      for (const todo of todos) {
        const response = await request(BASE_URL).post("/todo").send(todo);

        expect(response.status).toBe(200);
        createdTodos.push(response.body);
      }

      // 모든 todo 조회 (기존 데이터 + 새로 생성된 데이터)
      const getAllResponse = await request(BASE_URL).get("/todo");
      expect(getAllResponse.status).toBe(200);
      expect(getAllResponse.body.length).toBeGreaterThanOrEqual(3);

      // 생성된 todo들 삭제
      for (const todo of createdTodos) {
        const deleteResponse = await request(BASE_URL).delete(
          `/todo/${(todo as any).id}`,
        );
        expect(deleteResponse.status).toBe(200);
      }
    });
  });

  describe("에러 처리 E2E 테스트", () => {
    it("존재하지 않는 todo 조회", async () => {
      const response = await request(BASE_URL).get("/todo/99999");

      expect(response.status).toBe(200);
      // 존재하지 않는 todo는 null 또는 빈 문자열로 반환될 수 있음
      expect(response.body === null || response.body === "").toBe(true);
    });

    it("잘못된 ID 형식으로 조회", async () => {
      const response = await request(BASE_URL).get("/todo/invalid");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid ID format");
    });

    it("존재하지 않는 라우트 - 404", async () => {
      const response = await request(BASE_URL).get("/unknown-route");

      expect(response.status).toBe(404);
    });

    it("잘못된 JSON 데이터", async () => {
      const response = await request(BASE_URL)
        .post("/todo")
        .set("Content-Type", "application/json")
        .send("invalid json");

      expect(response.status).toBe(400);
    });
  });

  describe("성능 테스트", () => {
    it("동시 요청 처리", async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => request(BASE_URL).get("/"));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.text).toContain("Hello!");
      });
    });

    it("대량 todo 처리", async () => {
      // 50개의 todo 생성
      const todos = Array(50)
        .fill(null)
        .map((_, index) => ({
          title: `Bulk Todo ${index + 1}`,
          description: `대량 테스트용 todo ${index + 1}`,
          done: index % 2 === 0,
        }));

      const createPromises = todos.map((todo) =>
        request(BASE_URL).post("/todo").send(todo),
      );

      const responses = await Promise.all(createPromises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.id).toBeDefined();
      });

      // 생성된 todo들 조회 (기존 데이터 + 새로 생성된 50개)
      const getAllResponse = await request(BASE_URL).get("/todo");
      expect(getAllResponse.status).toBe(200);
      expect(getAllResponse.body.length).toBeGreaterThanOrEqual(50);

      // 생성된 todo들 삭제 (마지막 50개만)
      const createdTodos = responses.map((r) => r.body);
      const deletePromises = createdTodos.map((todo) =>
        request(BASE_URL).delete(`/todo/${todo.id}`),
      );

      const deleteResponses = await Promise.all(deletePromises);
      deleteResponses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});
