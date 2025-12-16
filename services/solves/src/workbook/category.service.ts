import { and, eq, isNull } from "drizzle-orm";
import { pgDb } from "../db";
import { categoryTable } from "./schema";
import { Category, CategoryTree } from "./types";

/**
 * flat 카테고리 리스트를 트리 구조로 변환
 */
function buildCategoryTree(categories: Category[]): CategoryTree[] {
  const categoryMap = new Map<number, CategoryTree>();

  // 먼저 모든 카테고리를 children 배열과 함께 맵에 저장
  for (const category of categories) {
    categoryMap.set(category.id, { ...category, children: [] });
  }

  const roots: CategoryTree[] = [];

  // 부모-자식 관계 설정
  for (const category of categories) {
    const node = categoryMap.get(category.id)!;
    if (category.parentId === null) {
      roots.push(node);
    } else {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  }

  return roots;
}

export const categoryService = {
  /**
   * 전체 카테고리 조회 (트리 구조)
   */
  getAllCategories: async (): Promise<CategoryTree[]> => {
    const categories = await pgDb
      .select({
        id: categoryTable.id,
        name: categoryTable.name,
        parentId: categoryTable.parentId,
        description: categoryTable.description,
        aiPrompt: categoryTable.aiPrompt,
        createdAt: categoryTable.createdAt,
      })
      .from(categoryTable);

    return buildCategoryTree(categories);
  },

  /**
   * 카테고리 조회 (by name and parentId)
   */
  getCategoryByNameAndParent: async (
    name: string,
    parentId: number | null,
  ): Promise<Category | null> => {
    const whereCondition =
      parentId === null
        ? and(eq(categoryTable.name, name), isNull(categoryTable.parentId))
        : and(
            eq(categoryTable.name, name),
            eq(categoryTable.parentId, parentId),
          );

    const [row] = await pgDb
      .select({
        id: categoryTable.id,
        name: categoryTable.name,
        parentId: categoryTable.parentId,
        description: categoryTable.description,
        aiPrompt: categoryTable.aiPrompt,
        createdAt: categoryTable.createdAt,
      })
      .from(categoryTable)
      .where(whereCondition);

    return row ?? null;
  },

  /**
   * 카테고리 생성
   */
  insertCategory: async (
    data: Omit<Category, "id" | "createdAt"> & { createdId?: string },
  ): Promise<Category> => {
    const [row] = await pgDb
      .insert(categoryTable)
      .values({
        name: data.name,
        parentId: data.parentId,
        description: data.description,
        aiPrompt: data.aiPrompt,
        createdId: data.createdId,
      })
      .returning({
        id: categoryTable.id,
        name: categoryTable.name,
        parentId: categoryTable.parentId,
        description: categoryTable.description,
        aiPrompt: categoryTable.aiPrompt,
        createdAt: categoryTable.createdAt,
      });

    return row;
  },

  /**
   * 카테고리 수정
   */
  updateCategory: async (
    id: number,
    data: Partial<Omit<Category, "id" | "createdAt">>,
  ): Promise<Category> => {
    const [row] = await pgDb
      .update(categoryTable)
      .set({
        name: data.name,
        parentId: data.parentId,
        description: data.description,
        aiPrompt: data.aiPrompt,
      })
      .where(eq(categoryTable.id, id))
      .returning({
        id: categoryTable.id,
        name: categoryTable.name,
        parentId: categoryTable.parentId,
        description: categoryTable.description,
        aiPrompt: categoryTable.aiPrompt,
        createdAt: categoryTable.createdAt,
      });

    return row;
  },

  /**
   * 카테고리 삭제
   */
  deleteCategory: async (id: number): Promise<void> => {
    await pgDb.delete(categoryTable).where(eq(categoryTable.id, id));
  },
};
