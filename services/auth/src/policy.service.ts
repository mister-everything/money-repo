import { and, desc, eq, inArray, lte } from "drizzle-orm";
import { pgDb } from "./db";
import { policyConsentTable, policyVersionTable, userTable } from "./schema";
import { PolicyType, PolicyVersion, PolicyVersionSchema } from "./shared";

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

  getLatestPolicyVersion: async (type: PolicyType) => {
    const [policy] = await pgDb
      .select()
      .from(policyVersionTable)
      .where(
        and(
          eq(policyVersionTable.type, type),
          lte(policyVersionTable.effectiveAt, new Date()),
        ),
      )
      .orderBy(desc(policyVersionTable.effectiveAt))
      .limit(1);
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
      .where(
        and(
          eq(policyVersionTable.isRequired, true),
          lte(policyVersionTable.effectiveAt, new Date()),
        ),
      )
      .orderBy(desc(policyVersionTable.effectiveAt));

    return allRequiredPolicies;
  },

  /**
   * 온보딩용 - 최신 정책 버전들 (title, content 포함)
   * DISTINCT ON으로 type별 최신 버전만 DB에서 직접 조회
   */
  getLatestPoliciesForOnboarding: async (): Promise<PolicyVersion[]> => {
    const policies = await pgDb
      .selectDistinctOn([policyVersionTable.type], {
        id: policyVersionTable.id,
        type: policyVersionTable.type,
        version: policyVersionTable.version,
        title: policyVersionTable.title,
        content: policyVersionTable.content,
        isRequired: policyVersionTable.isRequired,
        effectiveAt: policyVersionTable.effectiveAt,
      })
      .from(policyVersionTable)
      .where(lte(policyVersionTable.effectiveAt, new Date()))
      .orderBy(policyVersionTable.type, desc(policyVersionTable.effectiveAt));

    return policies;
  },

  hasRequiredPolicyConsent: async (userId: string): Promise<boolean> => {
    const requiredPolicies = await policyService.getRequiredPolicyVersions();

    if (requiredPolicies.length === 0) return true;

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

    return userConsents.length === requiredPolicies.length;
  },

  /**
   * 사용자의 필수 동의 여부 체크 및 consentedAt 업데이트
   * @returns true if all required consents are valid, false otherwise
   */
  checkAndUpdateConsent: async (userId: string): Promise<boolean> => {
    const isAllConsented = await policyService.hasRequiredPolicyConsent(userId);

    if (!isAllConsented) {
      await pgDb
        .update(userTable)
        .set({ consentedAt: null })
        .where(eq(userTable.id, userId));

      return false;
    }

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
   * 이미 동의한 약관이 있으면 업데이트 (upsert)
   */
  recordConsent: async (
    userId: string,
    consents: { policyVersionId: string; isAgreed: boolean }[],
    options: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<void> => {
    const now = new Date();

    await pgDb.transaction(async (tx) => {
      for (const consent of consents) {
        await tx
          .insert(policyConsentTable)
          .values({
            userId,
            policyVersionId: consent.policyVersionId,
            isAgreed: consent.isAgreed,
            consentedAt: now,
            ipAddress: options.ipAddress ?? null,
            userAgent: options.userAgent ?? null,
          })
          .onConflictDoUpdate({
            target: [
              policyConsentTable.userId,
              policyConsentTable.policyVersionId,
            ],
            set: {
              isAgreed: consent.isAgreed,
              consentedAt: now,
              ipAddress: options.ipAddress ?? null,
              userAgent: options.userAgent ?? null,
            },
          });
      }
    });
  },
};
