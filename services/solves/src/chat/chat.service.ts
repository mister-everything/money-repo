import { and, desc, eq } from "drizzle-orm";
import { pgDb } from "../db";
import {
  ChatMessageTable,
  ChatThreadTable,
  WorkbookCreateChatThreadTable,
} from "./schema";
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
  /**
   * workbookId로 연결된 thread 목록 조회
   * @param param - workbookId와 userId
   * @returns thread 목록 (최신순)
   */
  async selectThreadsByWorkbookId(param: {
    workbookId: string;
    userId: string;
  }) {
    const threads = await pgDb
      .select({
        id: ChatThreadTable.id,
        title: ChatThreadTable.title,
        createdAt: ChatThreadTable.createdAt,
        updatedAt: ChatThreadTable.updatedAt,
      })
      .from(WorkbookCreateChatThreadTable)
      .innerJoin(
        ChatThreadTable,
        eq(WorkbookCreateChatThreadTable.threadId, ChatThreadTable.id),
      )
      .where(
        and(
          eq(WorkbookCreateChatThreadTable.workbookId, param.workbookId),
          eq(WorkbookCreateChatThreadTable.userId, param.userId),
        ),
      )
      .orderBy(desc(ChatThreadTable.updatedAt));
    return threads;
  },
  /**
   * workbookId와 threadId를 연결
   * @param param - workbookId, threadId, userId
   */
  async linkThreadToWorkbook(param: {
    workbookId: string;
    threadId: string;
    userId: string;
  }) {
    await pgDb.insert(WorkbookCreateChatThreadTable).values({
      workbookId: param.workbookId,
      threadId: param.threadId,
      userId: param.userId,
    });
  },
};
