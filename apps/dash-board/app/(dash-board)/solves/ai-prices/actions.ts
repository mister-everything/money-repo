"use server";

import { aiPriceAdminService } from "@service/solves";
import {
  createAIPriceSchema,
  updateAIPriceSchema,
} from "@service/solves/shared";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type FormState = {
  success: boolean;
  errors?: Record<string, string[]>;
  message?: string;
};

/**
 * AI 가격 생성 액션
 */
export async function createAIPriceAction(
  _prevState: FormState | null,
  formData: FormData,
): Promise<FormState> {
  try {
    const data = {
      provider: formData.get("provider") as string,
      model: formData.get("model") as string,
      modelType: formData.get("modelType") as
        | "text"
        | "image"
        | "audio"
        | "video"
        | "embedding",
      inputTokenPrice: formData.get("inputTokenPrice") as string,
      outputTokenPrice: formData.get("outputTokenPrice") as string,
      cachedTokenPrice: formData.get("cachedTokenPrice") as string,
      markupRate: formData.get("markupRate") as string,
      isActive: formData.get("isActive") === "true",
    };

    // Validation
    const validated = createAIPriceSchema.parse(data);

    await aiPriceAdminService.createPrice(validated);
    revalidatePath("/solves/ai-prices");

    return {
      success: true,
      message: "AI 가격이 생성되었습니다.",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
        message: "입력값을 확인해주세요.",
      };
    }
    console.error("AI 가격 생성 실패:", error);
    return {
      success: false,
      message: "AI 가격 생성에 실패했습니다.",
    };
  }
}

/**
 * AI 가격 수정 액션
 */
export async function updateAIPriceAction(
  priceId: string,
  _prevState: FormState | null,
  formData: FormData,
): Promise<FormState> {
  try {
    const data = {
      provider: formData.get("provider") as string,
      model: formData.get("model") as string,
      modelType: formData.get("modelType") as
        | "text"
        | "image"
        | "audio"
        | "video"
        | "embedding",
      inputTokenPrice: formData.get("inputTokenPrice") as string,
      outputTokenPrice: formData.get("outputTokenPrice") as string,
      cachedTokenPrice: formData.get("cachedTokenPrice") as string,
      markupRate: formData.get("markupRate") as string,
      isActive: formData.get("isActive") === "true",
    };

    // Validation
    const validated = updateAIPriceSchema.parse(data);

    await aiPriceAdminService.updatePrice(priceId, validated);
    revalidatePath("/solves/ai-prices");

    return {
      success: true,
      message: "AI 가격이 수정되었습니다.",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
        message: "입력값을 확인해주세요.",
      };
    }
    console.error("AI 가격 수정 실패:", error);
    return {
      success: false,
      message: "AI 가격 수정에 실패했습니다.",
    };
  }
}

/**
 * AI 가격 활성화/비활성화 토글 액션
 */
export async function toggleAIPriceActiveAction(
  priceId: string,
  isActive: boolean,
) {
  try {
    await aiPriceAdminService.setPriceActive(priceId, isActive);
    revalidatePath("/solves/ai-prices");
  } catch (error) {
    console.error("AI 가격 상태 변경 실패:", error);
    throw new Error("AI 가격 상태 변경에 실패했습니다.");
  }
}
