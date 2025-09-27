import { eq, inArray, sql } from "drizzle-orm";
import { pgDb } from "./db";
import {
  probAnswerMetaTable,
  probBooksTable,
  probBookTagsTable,
  probContentsTable,
  probOptionsTable,
  probsTable,
  probTagsTable,
  tagsTable,
} from "./schema";
import {
  AnswerMeta,
  ProbBlock,
  ProbBook,
  ProbBookSaveInput,
  Tag,
} from "./types";

export const probService = {
  findAll: async (): Promise<ProbBook[]> => {
    const probBooks = await pgDb.select().from(probBooksTable);

    // 각 문제집에 대해 관련 데이터들을 조회하고 조합
    const results = await Promise.all(
      probBooks.map(async (book) => {
        const [blocks, tags] = await Promise.all([
          _getProbBlocks(book.id),
          _getBookTags(book.id),
        ]);
        return {
          ...book,
          blocks,
          tags,
        } as ProbBook;
      }),
    );

    return results;
  },

  findById: async (id: string): Promise<ProbBook | null> => {
    const [probBook] = await pgDb
      .select()
      .from(probBooksTable)
      .where(eq(probBooksTable.id, id));

    if (!probBook) return null;

    const [blocks, tags] = await Promise.all([
      _getProbBlocks(id),
      _getBookTags(id),
    ]);

    return {
      ...probBook,
      blocks,
      tags,
    } as ProbBook;
  },

  findByOwnerId: async (ownerId: string): Promise<ProbBook[]> => {
    const probBooks = await pgDb
      .select()
      .from(probBooksTable)
      .where(eq(probBooksTable.ownerId, ownerId));

    const results = await Promise.all(
      probBooks.map(async (book) => {
        const [blocks, tags] = await Promise.all([
          _getProbBlocks(book.id),
          _getBookTags(book.id),
        ]);
        return {
          ...book,
          blocks,
          tags,
        } as ProbBook;
      }),
    );

    return results;
  },

  save: async (probBookData: ProbBookSaveInput): Promise<ProbBook> => {
    try {
      const savedBookId = await pgDb.transaction(async (tx) => {
        const { blocks, tags, ...bookData } = probBookData;

        // 1. 문제집 저장
        const insertData = {
          id: bookData.id || `prob-book-${Date.now()}`, // id가 없으면 생성
          ownerId: bookData.ownerId,
          title: bookData.title,
          description: bookData.description || null,
          updatedAt: new Date(),
        };

        const [savedBook] = await tx
          .insert(probBooksTable)
          .values(insertData)
          .onConflictDoUpdate({
            target: [probBooksTable.id],
            set: {
              ownerId: insertData.ownerId,
              title: insertData.title,
              description: insertData.description,
              updatedAt: new Date(),
            },
          })
          .returning();

        // 2. 기존 관계 데이터들 삭제 (CASCADE로 관련 데이터도 자동 삭제)
        await Promise.all([
          tx.delete(probsTable).where(eq(probsTable.probBookId, savedBook.id)),
          tx
            .delete(probBookTagsTable)
            .where(eq(probBookTagsTable.probBookId, savedBook.id)),
        ]);

        // 3. 문제집 태그들 저장
        if (tags && tags.length > 0) {
          const savedTags = await _saveTags(tx, tags);
          await Promise.all(
            savedTags.map((tag) =>
              tx.insert(probBookTagsTable).values({
                probBookId: savedBook.id,
                tagId: tag.id,
              }),
            ),
          );
        }

        // 4. 새로운 문제들 저장
        for (const block of blocks) {
          // 문제 저장
          const [savedProb] = await tx
            .insert(probsTable)
            .values({
              id: block.id,
              probBookId: savedBook.id,
              title: block.title,
              style: block.style,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();

          // 정답 메타 저장
          const answerMeta = block.answerMeta;
          await tx.insert(probAnswerMetaTable).values({
            probId: savedProb.id,
            kind: answerMeta.kind,
            multiple:
              answerMeta.kind === "objective"
                ? (answerMeta as any).multiple
                : null,
            randomized:
              answerMeta.kind === "objective"
                ? (answerMeta as any).randomized
                : null,
            charLimit:
              answerMeta.kind === "subjective"
                ? (answerMeta as any).charLimit
                : null,
            lines:
              answerMeta.kind === "subjective"
                ? (answerMeta as any).lines
                : null,
            placeholder:
              answerMeta.kind === "subjective"
                ? (answerMeta as any).placeholder
                : null,
          });

          // 문제 태그들 저장
          if (block.tags && block.tags.length > 0) {
            const savedProbTags = await _saveTags(tx, block.tags);
            await Promise.all(
              savedProbTags.map((tag) =>
                tx.insert(probTagsTable).values({
                  probId: savedProb.id,
                  tagId: tag.id,
                }),
              ),
            );
          }

          // 문제 내용 저장
          await _saveProbContent(tx, savedProb.id, block.content);

          // 문제 선택지들 저장
          if (block.options) {
            for (const option of block.options) {
              const optionData = option.data as any;
              await tx.insert(probOptionsTable).values({
                probId: savedProb.id,
                type: option.type,
                content: optionData.content,
                url: optionData.url || null,
                isCorrect: false, // TODO: 정답 로직 개선 필요
              });
            }
          }
        }

        // 5. 트랜잭션 완료, 문제집 ID 반환
        return savedBook.id;
      });

      // 트랜잭션 완료 후 조회
      const finalResult = await probService.findById(savedBookId);
      return finalResult as ProbBook;
    } catch (error) {
      throw error;
    }
  },

  deleteById: async (id: string): Promise<void> => {
    await pgDb.delete(probBooksTable).where(eq(probBooksTable.id, id));
  },

  searchByTitle: async (searchTerm: string): Promise<ProbBook[]> => {
    const probBooks = await pgDb
      .select()
      .from(probBooksTable)
      .where(eq(probBooksTable.title, searchTerm));

    const results = await Promise.all(
      probBooks.map(async (book) => {
        const [blocks, tags] = await Promise.all([
          _getProbBlocks(book.id),
          _getBookTags(book.id),
        ]);
        return {
          ...book,
          blocks,
          tags,
        } as ProbBook;
      }),
    );

    return results;
  },

  // 새로운 메서드: 태그로 검색
  findByTags: async (tagNames: string[]): Promise<ProbBook[]> => {
    // 태그 ID들 조회
    const tags = await pgDb
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(inArray(tagsTable.name, tagNames));

    if (tags.length === 0) return [];

    // 해당 태그들을 가진 문제집들 조회
    const probBookIds = await pgDb
      .select({ probBookId: probBookTagsTable.probBookId })
      .from(probBookTagsTable)
      .where(
        inArray(
          probBookTagsTable.tagId,
          tags.map((t) => t.id),
        ),
      );

    if (probBookIds.length === 0) return [];

    // 문제집들 조회
    const probBooks = await pgDb
      .select()
      .from(probBooksTable)
      .where(
        inArray(
          probBooksTable.id,
          probBookIds.map((p) => p.probBookId),
        ),
      );

    const results = await Promise.all(
      probBooks.map(async (book) => {
        const [blocks, bookTags] = await Promise.all([
          _getProbBlocks(book.id),
          _getBookTags(book.id),
        ]);
        return {
          ...book,
          blocks,
          tags: bookTags,
        } as ProbBook;
      }),
    );

    return results;
  },

  // 새로운 메서드: 태그 통계
  getTagStats: async () => {
    return await pgDb
      .select({
        tagName: tagsTable.name,
        bookCount: sql<number>`count(distinct ${probBookTagsTable.probBookId})`,
        probCount: sql<number>`count(distinct ${probTagsTable.probId})`,
      })
      .from(tagsTable)
      .leftJoin(probBookTagsTable, eq(tagsTable.id, probBookTagsTable.tagId))
      .leftJoin(probTagsTable, eq(tagsTable.id, probTagsTable.tagId))
      .groupBy(tagsTable.name)
      .orderBy(sql`count(distinct ${probBookTagsTable.probBookId}) desc`);
  },

  // 새로운 메서드: 모든 태그 조회
  getAllTags: async (): Promise<Tag[]> => {
    return await pgDb.select().from(tagsTable).orderBy(tagsTable.name);
  },
};

// 헬퍼 함수: 문제집 ID로 ProbBlock[] 조회 (정규화된 구조)
async function _getProbBlocks(probBookId: string): Promise<ProbBlock[]> {
  // 문제들을 순서대로 조회
  const probs = await pgDb
    .select()
    .from(probsTable)
    .where(eq(probsTable.probBookId, probBookId));

  const blocks = await Promise.all(
    probs.map(async (prob) => {
      // 병렬로 모든 관련 데이터 조회
      const [contents, options, answerMeta, probTags] = await Promise.all([
        pgDb
          .select()
          .from(probContentsTable)
          .where(eq(probContentsTable.probId, prob.id)),
        pgDb
          .select()
          .from(probOptionsTable)
          .where(eq(probOptionsTable.probId, prob.id)),
        pgDb
          .select()
          .from(probAnswerMetaTable)
          .where(eq(probAnswerMetaTable.probId, prob.id)),
        _getProbTags(prob.id),
      ]);

      // 정답 메타 변환
      const meta = answerMeta[0];
      const answerMetaForBlock: AnswerMeta = meta
        ? {
            probId: meta.probId,
            kind: meta.kind as "objective" | "subjective",
            ...(meta.kind === "objective" && {
              multiple: meta.multiple || undefined,
              randomized: meta.randomized || undefined,
            }),
            ...(meta.kind === "subjective" && {
              charLimit: meta.charLimit || undefined,
              lines: meta.lines || undefined,
              placeholder: meta.placeholder || undefined,
            }),
          }
        : {
            probId: prob.id,
            kind: "objective" as const,
          };

      // ProbBlock 형태로 변환
      const probBlock: ProbBlock = {
        id: prob.id,
        style: prob.style,
        title: prob.title || undefined,
        tags: probTags,
        answerMeta: answerMetaForBlock,
        content: _buildProbContent(contents),
        options: options.map((option) => ({
          id: option.id.toString(),
          type: option.type as any,
          data: {
            content: option.content,
            url: option.url || undefined,
          } as any,
        })),
      };

      return probBlock;
    }),
  );

  return blocks;
}

// 헬퍼 함수: 문제집 태그들 조회
async function _getBookTags(probBookId: string): Promise<Tag[]> {
  return await pgDb
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      createdAt: tagsTable.createdAt,
    })
    .from(tagsTable)
    .innerJoin(probBookTagsTable, eq(tagsTable.id, probBookTagsTable.tagId))
    .where(eq(probBookTagsTable.probBookId, probBookId))
    .orderBy(tagsTable.name);
}

// 헬퍼 함수: 문제 태그들 조회
async function _getProbTags(probId: string): Promise<Tag[]> {
  return await pgDb
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      createdAt: tagsTable.createdAt,
    })
    .from(tagsTable)
    .innerJoin(probTagsTable, eq(tagsTable.id, probTagsTable.tagId))
    .where(eq(probTagsTable.probId, probId))
    .orderBy(tagsTable.name);
}

// 헬퍼 함수: 태그들 저장/조회 (중복 제거)
async function _saveTags(tx: any, tagNames: string[]): Promise<Tag[]> {
  const uniqueTagNames = [...new Set(tagNames)];
  const savedTags: Tag[] = [];

  for (const tagName of uniqueTagNames) {
    // 태그가 없으면 생성
    await tx.insert(tagsTable).values({ name: tagName }).onConflictDoNothing();

    // 태그 조회
    const [tag] = await tx
      .select()
      .from(tagsTable)
      .where(eq(tagsTable.name, tagName));

    savedTags.push(tag);
  }

  return savedTags;
}

// 헬퍼 함수: content 저장 (mixed 배열 지원)
async function _saveProbContent(tx: any, probId: string, content: any) {
  const contentData = content.data as any;

  // mixed 타입인 경우 - 배열의 각 요소를 별도 row로 저장
  if (content.type === "mixed" && Array.isArray(contentData)) {
    for (let i = 0; i < contentData.length; i++) {
      const item = contentData[i];
      await tx.insert(probContentsTable).values({
        probId: probId,
        type: "mixed",
        content: item.content,
        url: item.url || null,
        duration: item.duration || null,
      });
    }
  } else {
    // 다른 타입들 (text, image, video, audio) - 단일 저장
    await tx.insert(probContentsTable).values({
      probId: probId,
      type: content.type,
      content: contentData.content,
      url: contentData.url || null,
      duration: contentData.duration || null,
    });
  }
}

// 헬퍼 함수: content 타입에 따라 적절히 변환
function _buildProbContent(contents: any[]): any {
  if (!contents || contents.length === 0) {
    return {
      id: "default",
      type: "text",
      data: { content: "" },
    };
  }

  const firstContent = contents[0];

  // mixed 타입인 경우 - 배열로 조합
  if (firstContent.type === "mixed") {
    const mixedData = contents
      .filter((c) => c.type === "mixed")
      .map((c) => ({
        content: c.content,
        url: c.url || undefined,
        duration: c.duration || undefined,
      }));

    return {
      id: firstContent.id.toString(),
      type: "mixed",
      data: mixedData,
    };
  }

  // 다른 타입들 (text, image, video, audio) - 첫 번째만 사용
  return {
    id: firstContent.id.toString(),
    type: firstContent.type as any,
    data: {
      content: firstContent.content,
      url: firstContent.url || undefined,
      duration: firstContent.duration || undefined,
    } as any,
  };
}
