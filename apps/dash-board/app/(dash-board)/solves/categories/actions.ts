"use server";

import { categoryService } from "@service/solves";
import { z } from "zod";
import { safeAction } from "@/lib/protocol/server-action";

/**
 * 대분류 추가 스키마
 */
const addMainCategorySchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(300).optional(),
  aiPrompt: z.string().max(300).optional(),
});

export type AddMainCategoryData = z.infer<typeof addMainCategorySchema>;

/**
 * 중분류 추가 스키마
 */
const addSubCategorySchema = z.object({
  name: z.string().min(1).max(50),
  mainId: z.number().int().positive(),
  description: z.string().max(300).optional(),
  aiPrompt: z.string().max(300).optional(),
});

export type AddSubCategoryData = z.infer<typeof addSubCategorySchema>;

/**
 * 대분류 추가 액션
 */
export const addMainCategoryAction = safeAction(
  addMainCategorySchema,
  async (data) => {
    // 중복 확인
    const exists = await categoryService.existsMainCategoryByName(data.name);
    if (exists) {
      throw new Error("이미 존재하는 대분류 이름입니다.");
    }

    const category = await categoryService.insertMainCategory({
      name: data.name,
      description: data.description || null,
      aiPrompt: data.aiPrompt || null,
    });

    return { success: true, category };
  },
);

/**
 * 중분류 추가 액션
 */
export const addSubCategoryAction = safeAction(
  addSubCategorySchema,
  async (data) => {
    // 중복 확인
    const exists = await categoryService.existsSubCategoryByName(
      data.name,
      data.mainId,
    );
    if (exists) {
      throw new Error("이미 존재하는 중분류 이름입니다.");
    }

    const category = await categoryService.insertSubCategory({
      name: data.name,
      mainId: data.mainId,
      description: data.description || null,
      aiPrompt: data.aiPrompt || null,
    });

    return { success: true, category };
  },
);

/**
 * 대분류 수정 스키마
 */
const updateMainCategorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(50),
  description: z.string().max(300).optional(),
  aiPrompt: z.string().max(300).optional(),
});

export type UpdateMainCategoryData = z.infer<typeof updateMainCategorySchema>;

/**
 * 중분류 수정 스키마
 */
const updateSubCategorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(50),
  mainId: z.number().int().positive(),
  description: z.string().max(300).optional(),
  aiPrompt: z.string().max(300).optional(),
});

export type UpdateSubCategoryData = z.infer<typeof updateSubCategorySchema>;

/**
 * 대분류 수정 액션
 */
export const updateMainCategoryAction = safeAction(
  updateMainCategorySchema,
  async (data) => {
    // 같은 이름의 다른 카테고리가 있는지 확인
    const exists = await categoryService.existsMainCategoryByName(data.name);
    if (exists && exists.id !== data.id) {
      throw new Error("이미 존재하는 대분류 이름입니다.");
    }

    const category = await categoryService.updateMainCategory(data.id, {
      name: data.name,
      description: data.description || null,
      aiPrompt: data.aiPrompt || null,
    });

    return { success: true, category };
  },
);

/**
 * 중분류 수정 액션
 */
export const updateSubCategoryAction = safeAction(
  updateSubCategorySchema,
  async (data) => {
    // 같은 이름의 다른 카테고리가 있는지 확인
    const exists = await categoryService.existsSubCategoryByName(
      data.name,
      data.mainId,
    );
    if (exists && exists.id !== data.id) {
      throw new Error("이미 존재하는 중분류 이름입니다.");
    }

    const category = await categoryService.updateSubCategory(data.id, {
      name: data.name,
      mainId: data.mainId,
      description: data.description || null,
      aiPrompt: data.aiPrompt || null,
    });

    return { success: true, category };
  },
);

/**
 * 대분류 삭제 액션
 */
export const deleteMainCategoryAction = safeAction(
  z.object({ id: z.number().int().positive() }),
  async (data) => {
    await categoryService.deleteMainCategory(data.id);
    return { success: true };
  },
);

/**
 * 중분류 삭제 액션
 */
export const deleteSubCategoryAction = safeAction(
  z.object({ id: z.number().int().positive() }),
  async (data) => {
    await categoryService.deleteSubCategory(data.id);
    return { success: true };
  },
);
