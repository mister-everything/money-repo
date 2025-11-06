import { and, eq } from "drizzle-orm";
import { pgDb } from "../db";
import { ChatMessageTable, ChatThreadTable } from "./schema";
import { ChatMessage } from "./types";

export const chatService = {
  // upsert
  async saveThread(thread: { id?: string; userId: string; title?: string }) {
    const [result] = await pgDb
      .insert(ChatThreadTable)
      .values({
        title: "",
        ...thread,
      })
      .onConflictDoUpdate({
        target: [ChatThreadTable.id],
        set: {
          title: thread.title,
        },
      })
      .returning();
    return result;
  },
  async isThreadOwner(param: { threadId: string; userId: string }) {
    const [thread] = await pgDb
      .select({ id: ChatThreadTable })
      .from(ChatThreadTable)
      .where(
        and(
          eq(ChatThreadTable.id, param.threadId),
          eq(ChatThreadTable.userId, param.userId),
        ),
      );
    return thread != null;
  },
  async deleteThread(threadId: string) {
    await pgDb.delete(ChatThreadTable).where(eq(ChatThreadTable.id, threadId));
  },
  async selectMessages(threadId: string) {
    const result = await pgDb
      .select()
      .from(ChatMessageTable)
      .where(eq(ChatMessageTable.threadId, threadId))
      .orderBy(ChatMessageTable.createdAt);
    return result as ChatMessage[];
  },
  async upsertMessage(message: Omit<ChatMessage, "createdAt">) {
    await pgDb
      .insert(ChatMessageTable)
      .values(message)
      .onConflictDoUpdate({
        target: [ChatMessageTable.id],
        set: {
          parts: message.parts,
          metadata: message.metadata,
        },
      });
  },
};
