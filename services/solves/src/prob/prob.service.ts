import { userTable } from "@service/auth";
import { eq, inArray, sql } from "drizzle-orm";
import { pgDb } from "../db";
import {
  probBlocksTable,
  probBooksTable,
  probBookTagsTable,
  tagsTable,
} from "./schema";
import {
  CreateProbBlock,
  CreateProbBook,
  createProbBlockSchema,
  createProbBookSchema,
  ProbBlock,
  ProbBook,
  ProbBookWithoutBlocks,
} from "./types";

export const probService = {
  isProbBookOwner: async (
    probBookId: string,
    userId: string,
  ): Promise<boolean> => {
    const [probBook] = await pgDb
      .select({
        ownerId: probBooksTable.ownerId,
      })
      .from(probBooksTable)
      .where(eq(probBooksTable.id, probBookId));
    return probBook?.ownerId === userId;
  },

  hasProbBookPermission: async (
    probBookId: string,
    userId: string,
  ): Promise<boolean> => {
    const [probBook] = await pgDb
      .select({
        id: probBooksTable.id,
        isPublic: probBooksTable.isPublic,
        ownerId: probBooksTable.ownerId,
      })
      .from(probBooksTable)
      .where(eq(probBooksTable.id, probBookId));
    const isOwner = probBook?.ownerId === userId;
    const isPublic = probBook?.isPublic;
    return isOwner || isPublic;
  },

  /**
   * 공개된 문제집 목록 조회
   * @todo 검색옵션 추가 (pagination, 검색어, 태그, 퍼블릭 여부, owner,id )
   */
  async searchProbBooks(options = {}): Promise<ProbBookWithoutBlocks[]> {
    const rows = await pgDb
      .select({
        id: probBooksTable.id,
        title: probBooksTable.title,
        description: probBooksTable.description,
        isPublic: probBooksTable.isPublic,
        thumbnail: probBooksTable.thumbnail,
        ownerName: userTable.name,
        ownerProfile: userTable.image,
        tags: sql<
          string[]
        >`coalesce(array_agg(${tagsTable.name}) filter (where ${tagsTable.name} is not null), '{}')`,
      })
      .from(probBooksTable)
      .innerJoin(userTable, eq(probBooksTable.ownerId, userTable.id))
      .leftJoin(
        probBookTagsTable,
        eq(probBooksTable.id, probBookTagsTable.probBookId),
      )
      .leftJoin(tagsTable, eq(probBookTagsTable.tagId, tagsTable.id))
      .groupBy(probBooksTable.id, userTable.id);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      tags: row.tags ?? [],
      isPublic: row.isPublic,
      owner: {
        name: row.ownerName,
        profile: row.ownerProfile ?? undefined,
      },
      thumbnail: row.thumbnail ?? undefined,
    }));
  },

  selectProbBookById: async (id: string): Promise<ProbBook | null> => {
    const [book] = await pgDb
      .select({
        id: probBooksTable.id,
        title: probBooksTable.title,
        description: probBooksTable.description,
        isPublic: probBooksTable.isPublic,
        thumbnail: probBooksTable.thumbnail,
        ownerName: userTable.name,
        ownerProfile: userTable.image,
        tags: sql<
          string[]
        >`coalesce(array_agg(${tagsTable.name}) filter (where ${tagsTable.name} is not null), '{}')`,
      })
      .from(probBooksTable)
      .innerJoin(userTable, eq(probBooksTable.ownerId, userTable.id))
      .leftJoin(
        probBookTagsTable,
        eq(probBooksTable.id, probBookTagsTable.probBookId),
      )
      .leftJoin(tagsTable, eq(probBookTagsTable.tagId, tagsTable.id))
      .where(eq(probBooksTable.id, id))
      .groupBy(probBooksTable.id, userTable.id);

    if (!book) {
      return null;
    }
    const blocks = await pgDb
      .select({
        id: probBlocksTable.id,
        content: probBlocksTable.content,
        question: probBlocksTable.question,
        // answer: probBlocksTable.answer, // 풀이 모드에서는 정답 데이터 제외
        order: probBlocksTable.order,
        type: probBlocksTable.type,
      })
      .from(probBlocksTable)
      .where(eq(probBlocksTable.probBookId, id));

    return {
      id: book.id,
      title: book.title,
      description: book.description ?? undefined,
      isPublic: book.isPublic,
      thumbnail: book.thumbnail ?? undefined,
      blocks: blocks.map((block) => ({
        id: block.id,
        content: block.content,
        question: block.question ?? undefined,
        order: block.order,
        type: block.type,
      })),
      owner: {
        name: book.ownerName,
        profile: book.ownerProfile ?? undefined,
      },
      tags: book.tags ?? [],
    };
  },

  /**
   * 문제집에 태그 저장
   */
  saveTagByBookId: async (bookId: string, tags: string[]): Promise<void> => {
    // 기존 태그 삭제
    await pgDb
      .delete(probBookTagsTable)
      .where(eq(probBookTagsTable.probBookId, bookId));

    // 태그 저장
    await pgDb
      .insert(tagsTable)
      .values(
        tags.map((tag) => ({
          name: tag,
        })),
      )
      .onConflictDoNothing({
        target: [tagsTable.name],
      });
    const selectedTags = await pgDb
      .select({
        id: tagsTable.id,
      })
      .from(tagsTable)
      .where(inArray(tagsTable.name, tags));

    // 새 태그 저장
    await pgDb.insert(probBookTagsTable).values(
      selectedTags.map((tag) => ({
        probBookId: bookId,
        tagId: tag.id,
      })),
    );
  },

  /**
   * 문제집 생성
   */
  createProbBook: async (probBook: CreateProbBook): Promise<{ id: string }> => {
    const parsedProbBook = createProbBookSchema.parse(probBook);
    const data: typeof probBooksTable.$inferInsert = {
      ownerId: parsedProbBook.ownerId,
      title: parsedProbBook.title,
      description: parsedProbBook.description,
      isPublic: parsedProbBook.isPublic,
      thumbnail: parsedProbBook.thumbnail,
    };

    const [newProbBook] = await pgDb
      .insert(probBooksTable)
      .values(data)
      .returning({ id: probBooksTable.id });

    if (probBook.tags) {
      await probService.saveTagByBookId(newProbBook.id, probBook.tags);
    }
    return newProbBook;
  },

  /**
   * 문제집 삭제
   */
  deleteProbBook: async (id: string): Promise<void> => {
    await pgDb.delete(probBooksTable).where(eq(probBooksTable.id, id));
  },

  /**
   * 문제 생성
   */
  createProbBlock: async (probBlock: CreateProbBlock): Promise<ProbBlock> => {
    const parsedProbBlock = createProbBlockSchema.parse(probBlock);
    const data: typeof probBlocksTable.$inferInsert = {
      probBookId: parsedProbBlock.probBookId,
      order: parsedProbBlock.order,
      type: parsedProbBlock.type,
      question: parsedProbBlock.question,
      content: parsedProbBlock.content,
      answer: parsedProbBlock.answer,
    };

    const [newProbBlock] = await pgDb
      .insert(probBlocksTable)
      .values(data)
      .returning({
        id: probBlocksTable.id,
        content: probBlocksTable.content,
        question: probBlocksTable.question,
        answer: probBlocksTable.answer,
        order: probBlocksTable.order,
        type: probBlocksTable.type,
      });

    return {
      id: newProbBlock.id,
      type: newProbBlock.type,
      content: newProbBlock.content,
      question: newProbBlock.question ?? undefined,
      answer: newProbBlock.answer ?? undefined,
      order: newProbBlock.order,
    };
  },

  /**
   * 문제 삭제
   */
  deleteProbBlock: async (id: string): Promise<void> => {
    await pgDb.delete(probBlocksTable).where(eq(probBlocksTable.id, id));
  },
};
