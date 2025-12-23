import { and, desc, eq, inArray } from "drizzle-orm";
import { pgDb } from "./db";
import { policyConsentTable, policyVersionTable, userTable } from "./schema";
import { PolicyType, PolicyVersionSchema } from "./shared";

export const policyService = {
  getPolicyVersion: async (type: PolicyType, version: string) => {
    const [policy] = await pgDb
      .select()
      .from(policyVersionTable)
      .where(
        and(
          eq(policyVersionTable.type, type),
          eq(policyVersionTable.version, version),
        ),
      );

    return policy || null;
  },

  /**
   * 모든 약관 버전 조회 (관리자용)
   */
  getAllPolicyVersions: async (type?: PolicyType) => {
    const conditions = type ? [eq(policyVersionTable.type, type)] : [];

    const policies = await pgDb
      .select()
      .from(policyVersionTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(policyVersionTable.effectiveAt));

    return policies;
  },

  /**
   * 약관 버전 생성. 수정은 안됩니다. (관리자용)
   */
  createPolicyVersion: async (data: {
    type: PolicyType;
    version: string;
    title: string;
    content: string;
    effectiveAt: Date;
    createdBy: string;
    createdName: string;
  }) => {
    PolicyVersionSchema.parse(data.version);
    const [policy] = await pgDb
      .insert(policyVersionTable)
      .values({
        ...data,
        createdBy: data.createdBy ?? null,
        createdName: data.createdName ?? null,
      })
      .returning();

    return policy;
  },
  getRequiredPolicyVersions: async () => {
    const allRequiredPolicies = await pgDb
      .select({
        id: policyVersionTable.id,
        type: policyVersionTable.type,
        version: policyVersionTable.version,
      })
      .from(policyVersionTable)
      .where(eq(policyVersionTable.isRequired, true))
      .orderBy(desc(policyVersionTable.effectiveAt));

    return allRequiredPolicies;
  },

  /**
   * 사용자의 필수 동의 여부 체크 및 consentedAt 업데이트
   * @returns true if all required consents are valid, false otherwise
   */
  checkAndUpdateConsent: async (userId: string): Promise<boolean> => {
    // 1. 필수 정책들의 최신 버전 조회
    const requiredPolicies = await policyService.getRequiredPolicyVersions();

    if (requiredPolicies.length === 0) {
      // 필수 정책이 없으면 동의 완료로 처리
      return true;
    }

    // 2. 사용자의 동의 기록 조회 (최신 것만)
    const userConsents = await pgDb
      .select({
        id: policyConsentTable.id,
      })
      .from(policyConsentTable)
      .where(
        and(
          eq(policyConsentTable.userId, userId),
          eq(policyConsentTable.isAgreed, true),
          inArray(
            policyConsentTable.policyVersionId,
            requiredPolicies.map((p) => p.id),
          ),
        ),
      )
      .orderBy(desc(policyConsentTable.consentedAt));

    const isAllConsented = userConsents.length === requiredPolicies.length;

    // 3. 미동의 항목이 있으면 consentedAt를 null로 업데이트
    if (!isAllConsented) {
      await pgDb
        .update(userTable)
        .set({ consentedAt: null })
        .where(eq(userTable.id, userId));

      return false;
    }

    // 5. 모든 필수 동의 완료 - consentedAt가 null이면 현재 시간으로 설정
    const [user] = await pgDb
      .select({ consentedAt: userTable.consentedAt })
      .from(userTable)
      .where(eq(userTable.id, userId));

    if (user && !user.consentedAt) {
      await pgDb
        .update(userTable)
        .set({ consentedAt: new Date() })
        .where(eq(userTable.id, userId));
    }

    return true;
  },

  /**
   * 여러 약관에 대해 한번에 동의 처리 (온보딩용)
   */
  recordConsent: async (
    userId: string,
    consents: { policyVersionId: string; isAgreed: boolean }[],
    options: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<void> => {
    const now = new Date();

    await pgDb.transaction(async (tx) => {
      for (const consent of consents) {
        await tx.insert(policyConsentTable).values({
          userId,
          policyVersionId: consent.policyVersionId,
          isAgreed: consent.isAgreed,
          consentedAt: now,
          ipAddress: options.ipAddress ?? null,
          userAgent: options.userAgent ?? null,
        });
      }
    });
  },
};
