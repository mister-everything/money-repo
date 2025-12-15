import { PublicError } from "@workspace/error";
import { generateUUID } from "@workspace/util";
import { and, desc, eq } from "drizzle-orm";
import { pgDb } from "../db";
import {
  ChatMessageTable,
  ChatThreadTable,
  WorkbookCreateChatThreadTable,
} from "./schema";
import { ChatMessage, ChatThread, SystemPrompt } from "./types";

export const chatService = {
  async createThreadIfNotExists(param: {
    threadId: string;
    userId: string;
    title?: string;
  }) {
    const [thread] = await pgDb
      .select({ id: ChatThreadTable.id, ownerId: ChatThreadTable.userId })
      .from(ChatThreadTable)
      .where(and(eq(ChatThreadTable.id, param.threadId)));

    if (thread) {
      if (thread.ownerId !== param.userId) {
        throw new PublicError("Thread not found");
      }
      return {
        ...thread,
        isNew: false,
      };
    }

    const newThread = await pgDb
      .insert(ChatThreadTable)
      .values({
        id: param.threadId,
        userId: param.userId,
        title: param.title ?? "",
      })
      .returning();

    return {
      ...newThread,
      isNew: true,
    };
  },

  async deleteThread(threadId: string) {
    await pgDb.delete(ChatThreadTable).where(eq(ChatThreadTable.id, threadId));
  },

  async hasThreadPermission(threadId: string, userId: string) {
    const [thread] = await pgDb
      .select({ userId: ChatThreadTable.userId })
      .from(ChatThreadTable)
      .where(and(eq(ChatThreadTable.id, threadId)));
    return thread?.userId === userId;
  },

  async selectMessages(threadId: string) {
    const result = await pgDb
      .select()
      .from(ChatMessageTable)
      .where(eq(ChatMessageTable.threadId, threadId))
      .orderBy(ChatMessageTable.createdAt);
    return result as ChatMessage[];
  },
  async upsertMessage(
    message: Omit<ChatMessage, "createdAt" | "id"> & { id?: string },
  ) {
    await pgDb
      .insert(ChatMessageTable)
      .values({
        id: message.id ?? generateUUID(),
        threadId: message.threadId,
        role: message.role,
        parts: message.parts,
        metadata: message.metadata,
      })
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
  }): Promise<ChatThread[]> {
    const threads = await pgDb
      .select({
        id: ChatThreadTable.id,
        title: ChatThreadTable.title,
        createdAt: ChatThreadTable.createdAt,
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

  /**
   * 시스템 프롬프트 조회
   * @param systemPrompt - 시스템 프롬프트 Enum 값
   * @returns 시스템 프롬프트
   */
  async getSystemPrompt(systemPrompt: SystemPrompt) {
    // const [prompt] = await pgDb
    //   .select({ prompt: SystemPromptTable.prompt })
    //   .from(SystemPromptTable)
    //   .where(eq(SystemPromptTable.name, systemPrompt));
    // return prompt?.prompt;
    return null;
  },
};
