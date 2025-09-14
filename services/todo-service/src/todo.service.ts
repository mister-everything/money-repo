import { eq } from "drizzle-orm";
import { pgDb } from "./db";
import { todoSchema } from "./schema";
import { Todo } from "./types";

export const todoService = {
  findAll: async (): Promise<Todo[]> => {
    const todos = await pgDb.select().from(todoSchema);
    return todos;
  },
  findById: async (id: number): Promise<Todo | null> => {
    const [todo] = await pgDb
      .select()
      .from(todoSchema)
      .where(eq(todoSchema.id, id));
    return todo;
  },
  save: async (todo: typeof todoSchema.$inferInsert): Promise<Todo> => {
    const newTodo = await pgDb
      .insert(todoSchema)
      .values(todo)
      .onConflictDoUpdate({
        target: [todoSchema.id],
        set: todo,
      })
      .returning();
    return newTodo[0];
  },
  deleteById: async (id: number): Promise<void> => {
    await pgDb.delete(todoSchema).where(eq(todoSchema.id, id));
  },
};
