import { and, eq } from "drizzle-orm";
import { pgDb } from "../db";
import { categoryMainTable, categorySubTable } from "./schema";
import { CategoryMain, CategorySub, CategoryWithSubs } from "./types";

export const categoryService = {
  /**
   * 전체 카테고리 조회 (대분류 + 중분류 트리 구조)
   */
  getAllCategoriesWithSubs: async (): Promise<CategoryWithSubs[]> => {
    const mainCategoriesSQL = pgDb
      .select({
        id: categoryMainTable.id,
        name: categoryMainTable.name,
        description: categoryMainTable.description,
        aiPrompt: categoryMainTable.aiPrompt,
        createdAt: categoryMainTable.createdAt,
      })
      .from(categoryMainTable);

    const subCategoriesSQL = pgDb
      .select({
        id: categorySubTable.id,
        name: categorySubTable.name,
        mainId: categorySubTable.mainId,
        description: categorySubTable.description,
        aiPrompt: categorySubTable.aiPrompt,
        createdAt: categorySubTable.createdAt,
      })
      .from(categorySubTable);

    const [mainCategories, subCategories] = await Promise.all([
      mainCategoriesSQL,
      subCategoriesSQL,
    ]);

    return mainCategories.map((main) => ({
      ...main,
      subs: subCategories.filter((sub) => sub.mainId === main.id),
    }));
  },

  /**
   * 대분류 존재 여부 확인 (by name)
   */
  existsMainCategoryByName: async (
    name: string,
  ): Promise<CategoryMain | null> => {
    const [row] = await pgDb
      .select({
        id: categoryMainTable.id,
        name: categoryMainTable.name,
        description: categoryMainTable.description,
        aiPrompt: categoryMainTable.aiPrompt,
        createdAt: categoryMainTable.createdAt,
      })
      .from(categoryMainTable)
      .where(eq(categoryMainTable.name, name));
    return row ?? null;
  },

  /**
   * 중분류 존재 여부 확인 (by name)
   */
  existsSubCategoryByName: async (
    name: string,
    mainId: number,
  ): Promise<CategorySub | null> => {
    const [row] = await pgDb
      .select({
        id: categorySubTable.id,
        name: categorySubTable.name,
        mainId: categorySubTable.mainId,
        description: categorySubTable.description,
        aiPrompt: categorySubTable.aiPrompt,
        createdAt: categorySubTable.createdAt,
      })
      .from(categorySubTable)
      .where(
        and(
          eq(categorySubTable.name, name),
          eq(categorySubTable.mainId, mainId),
        ),
      );

    return row ?? null;
  },

  /**
   * 대분류 생성
   */
  insertMainCategory: async (
    data: Omit<CategoryMain, "id" | "createdAt"> & { createdId?: string },
  ): Promise<CategoryMain> => {
    const [row] = await pgDb
      .insert(categoryMainTable)
      .values({
        name: data.name,
        description: data.description,
        aiPrompt: data.aiPrompt,
        createdId: data.createdId,
      })
      .returning({
        id: categoryMainTable.id,
        name: categoryMainTable.name,
        description: categoryMainTable.description,
        aiPrompt: categoryMainTable.aiPrompt,
        createdAt: categoryMainTable.createdAt,
      });

    return row;
  },

  /**
   * 대분류 수정
   */
  updateMainCategory: async (
    id: number,
    data: Partial<Omit<CategoryMain, "id" | "createdAt">>,
  ): Promise<CategoryMain> => {
    const [row] = await pgDb
      .update(categoryMainTable)
      .set({
        name: data.name,
        description: data.description,
        aiPrompt: data.aiPrompt,
      })
      .where(eq(categoryMainTable.id, id))
      .returning({
        id: categoryMainTable.id,
        name: categoryMainTable.name,
        description: categoryMainTable.description,
        aiPrompt: categoryMainTable.aiPrompt,
        createdAt: categoryMainTable.createdAt,
      });

    return row;
  },

  /**
   * 중분류 생성
   */
  insertSubCategory: async (
    data: Omit<CategorySub, "id" | "createdAt"> & { createdId?: string },
  ): Promise<CategorySub> => {
    const [row] = await pgDb
      .insert(categorySubTable)
      .values({
        name: data.name,
        mainId: data.mainId,
        description: data.description,
        aiPrompt: data.aiPrompt,
        createdId: data.createdId,
      })
      .returning({
        id: categorySubTable.id,
        name: categorySubTable.name,
        mainId: categorySubTable.mainId,
        description: categorySubTable.description,
        aiPrompt: categorySubTable.aiPrompt,
        createdAt: categorySubTable.createdAt,
      });

    return row;
  },

  /**
   * 중분류 수정
   */
  updateSubCategory: async (
    id: number,
    data: Partial<Omit<CategorySub, "id" | "createdAt">>,
  ): Promise<CategorySub> => {
    const [row] = await pgDb
      .update(categorySubTable)
      .set({
        name: data.name,
        mainId: data.mainId,
        description: data.description,
        aiPrompt: data.aiPrompt,
      })
      .where(eq(categorySubTable.id, id))
      .returning({
        id: categorySubTable.id,
        name: categorySubTable.name,
        mainId: categorySubTable.mainId,
        description: categorySubTable.description,
        aiPrompt: categorySubTable.aiPrompt,
        createdAt: categorySubTable.createdAt,
      });

    return row;
  },

  /**
   * 대분류 삭제 (CASCADE로 중분류도 함께 삭제됨)
   */
  deleteMainCategory: async (id: number): Promise<void> => {
    await pgDb.delete(categoryMainTable).where(eq(categoryMainTable.id, id));
  },

  /**
   * 중분류 삭제
   */
  deleteSubCategory: async (id: number): Promise<void> => {
    await pgDb.delete(categorySubTable).where(eq(categorySubTable.id, id));
  },
};
