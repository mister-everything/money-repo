"use server";

import { categoryService } from "@service/solves";
import { z } from "zod";
import { getSession } from "@/lib/auth/server";
import { safeAction } from "@/lib/protocol/server-action";

const addCategorySchema = z.object({
  name: z.string().min(1).max(50),
  parentId: z.number().optional(),
  description: z.string().max(300).optional(),
  aiPrompt: z.string().max(300).optional(),
});

export type AddCategoryData = z.infer<typeof addCategorySchema>;

/**
 * 추가 액션
 */
export const addCategoryAction = safeAction(addCategorySchema, async (data) => {
  const session = await getSession();
  const category = await categoryService.insertCategory({
    name: data.name,
    parentId: data.parentId ?? null,
    description: data.description ?? null,
    aiPrompt: data.aiPrompt ?? null,
    createdId: session.user.id,
  });

  return { category };
});

/**
 * 중분류 수정 스키마
 */
const updateCategorySchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(300).optional(),
  aiPrompt: z.string().max(300).optional(),
});

export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;

/**
 * 카테고리 수정 액션
 */
export const updateCategoryAction = safeAction(
  updateCategorySchema,
  async (data) => {
    await getSession();
    const exists = await categoryService.updateCategory(data.id, {
      name: data.name,
      description: data.description || null,
      aiPrompt: data.aiPrompt || null,
    });

    return { category: exists };
  },
);

/**
 * 대분류 삭제 액션
 */
export const deleteCategoryAction = safeAction(
  z.object({ categoryId: z.number() }),
  async (data) => {
    await getSession();
    await categoryService.deleteCategory(data.categoryId);
    return { deletedCategoryId: data.categoryId };
  },
);
