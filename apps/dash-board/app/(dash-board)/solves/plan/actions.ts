"use server";

import { planAdminService } from "@service/solves";
import { createSubscriptionPlanSchema } from "@service/solves/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { treeifyError, z } from "zod";

type FormState = {
  success: boolean;
  errors?: Record<string, string[]>;
  message?: string;
};

/**
 * 플랜 생성 액션
 */
export async function createPlanAction(
  _prevState: FormState | null,
  formData: FormData,
): Promise<FormState> {
  try {
    // FormData에서 plans 배열 파싱
    const plansJson = formData.get("plans");
    const plans = plansJson ? JSON.parse(plansJson as string) : [];

    const data = {
      name: formData.get("name") as string,
      displayName: formData.get("displayName") as string,
      description: (formData.get("description") as string) || undefined,
      plans: plans.length > 0 ? plans : undefined,
      price: formData.get("price") as string,
      monthlyQuota: formData.get("monthlyQuota") as string,
      refillAmount: formData.get("refillAmount") as string,
      refillIntervalHours: Number(formData.get("refillIntervalHours")),
      maxRefillCount: Number(formData.get("maxRefillCount")),
      isActive: formData.get("isActive") === "true",
    };

    // Validation
    const validated = createSubscriptionPlanSchema.parse(data);

    await planAdminService.createPlan(validated);
    revalidatePath("/solves/plan");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: treeifyError(error),
        message: "입력값을 확인해주세요.",
      };
    }
    console.error("플랜 생성 실패:", error);
    return {
      success: false,
      message: "플랜 생성에 실패했습니다.",
    };
  }

  redirect("/solves/plan");
}

/**
 * 플랜 수정 액션
 */
export async function updatePlanAction(
  planId: string,
  _prevState: FormState | null,
  formData: FormData,
): Promise<FormState> {
  try {
    // FormData에서 plans 배열 파싱
    const plansJson = formData.get("plans");
    const plans = plansJson ? JSON.parse(plansJson as string) : [];

    const data = {
      name: formData.get("name") as string,
      displayName: formData.get("displayName") as string,
      description: (formData.get("description") as string) || undefined,
      plans: plans.length > 0 ? plans : undefined,
      price: formData.get("price") as string,
      monthlyQuota: formData.get("monthlyQuota") as string,
      refillAmount: formData.get("refillAmount") as string,
      refillIntervalHours: Number(formData.get("refillIntervalHours")),
      maxRefillCount: Number(formData.get("maxRefillCount")),
      isActive: formData.get("isActive") === "true",
    };

    // Validation
    const validated = createSubscriptionPlanSchema.partial().parse(data);

    await planAdminService.updatePlan(planId, validated);
    revalidatePath("/solves/plan");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
        message: "입력값을 확인해주세요.",
      };
    }
    console.error("플랜 수정 실패:", error);
    return {
      success: false,
      message: "플랜 수정에 실패했습니다.",
    };
  }

  redirect("/solves/plan");
}

/**
 * 플랜 활성화/비활성화 토글 액션
 */
export async function togglePlanActiveAction(
  planId: string,
  isActive: boolean,
) {
  try {
    await planAdminService.setPlanActive(planId, isActive);
    revalidatePath("/solves/plan");
    // redirect는 클라이언트에서 처리
  } catch (error) {
    console.error("플랜 상태 변경 실패:", error);
    throw new Error("플랜 상태 변경에 실패했습니다.");
  }
}
