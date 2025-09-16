import { eq } from "drizzle-orm";
import { pgDb } from "./db";
import { todoTable } from "./schema";
import { Todo } from "./types";

export const todoService = {
  findAll: async (): Promise<Todo[]> => {
    const todos = await pgDb.select().from(todoTable);
    return todos;
  },
  findById: async (id: number): Promise<Todo | null> => {
    const [todo] = await pgDb
      .select()
      .from(todoTable)
      .where(eq(todoTable.id, id));
    return todo;
  },
  save: async (todo: typeof todoTable.$inferInsert): Promise<Todo> => {
    const newTodo = await pgDb
      .insert(todoTable)
      .values(todo)
      .onConflictDoUpdate({
        target: [todoTable.id],
        set: todo,
      })
      .returning();
    return newTodo[0];
  },
  deleteById: async (id: number): Promise<void> => {
    await pgDb.delete(todoTable).where(eq(todoTable.id, id));
  },
};
