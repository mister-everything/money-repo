"use server";

import { policyService } from "@service/auth";
import { z } from "zod";
import { getUser } from "@/lib/auth/server";
import { safeAction } from "@/lib/protocol/server-action";

/**
 * 정책 생성 스키마
 */
const createPolicySchema = z.object({
  type: z.enum(["privacy", "terms", "community", "marketing"]),
  version: z
    .string()
    .min(1, "버전을 입력해주세요.")
    .regex(/^\d+\.\d+\.\d+$/, "버전 형식이 올바르지 않습니다. (예: 1.0.0)"),
  title: z.string().min(1, "제목을 입력해주세요."),
  content: z.string().min(1, "내용을 입력해주세요."),
  isRequired: z.boolean().default(true),
  effectiveAt: z.coerce.date(),
});

export type CreatePolicyInput = z.infer<typeof createPolicySchema>;

/**
 * 정책 생성 액션 (수정/삭제 불가)
 */
export const createPolicyAction = safeAction(
  createPolicySchema,
  async (data) => {
    const user = await getUser();
    const created = await policyService.createPolicyVersion({
      type: data.type,
      version: data.version,
      title: data.title,
      content: data.content,
      effectiveAt: data.effectiveAt,
      createdBy: user.id,
      createdName: user.name,
    });
    return created;
  },
);
