import {
  boolean,
  pgSchema,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { SCHEMA_NAME } from "./const";
import { NICKNAME_RULES } from "./shared";

export const authSchema = pgSchema(SCHEMA_NAME);

export const userTable = authSchema.table("user", {
  id: text("id").primaryKey(),
  publicId: serial("public_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  isAnonymous: boolean("is_anonymous"),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date()),
  deletedAt: timestamp("deleted_at"),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  phoneNumber: text("phone_number"),
  nickname: varchar("nickname", { length: NICKNAME_RULES.maxLength }),
  consentedAt: timestamp("consented_at"),
  /** 유입 경로 */
  referralSource: text("referral_source"),
  /** 직업 */
  occupation: text("occupation"),
});

export const sessionTable = authSchema.table("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export const accountTable = authSchema.table("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verificationTable = authSchema.table("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const invitationTable = authSchema.table("invitation", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  createdBy: text("created_by")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  usedBy: text("used_by").references(() => userTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/**
 * 약관 버전 테이블
 * 각 버전의 약관 콘텐츠를 저장 (법적 증빙용)
 */
export const policyVersionTable = authSchema.table(
  "policy_version",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** 버전 번호 (예: "1.0.0") */
    version: text("version").notNull(),
    /** 약관 유형: privacy (개인정보), terms (이용약관) */
    type: text("type").notNull(),
    /** 약관 제목 */
    title: text("title").notNull(),
    /** 약관 내용 (마크다운) */
    content: text("content").notNull(),
    /** 필수 여부 */
    isRequired: boolean("is_required").default(true).notNull(),
    /** 시행일 */
    effectiveAt: timestamp("effective_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdName: text("created_name"),
    createdBy: text("created_by").references(() => userTable.id, {
      onDelete: "set null",
    }),
  },
  (t) => [unique("uniq_policy_version_type_version").on(t.type, t.version)],
);

/**
 * 약관 동의 기록 테이블
 * 법적 증빙을 위해 모든 동의 이력을 보관
 */
export const policyConsentTable = authSchema.table(
  "policy_consent",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    policyVersionId: uuid("policy_version_id")
      .notNull()
      .references(() => policyVersionTable.id, { onDelete: "cascade" }),
    /** 동의 여부 (true: 동의, false: 철회) */
    isAgreed: boolean("is_agreed").default(true).notNull(),
    /** 동의 일시 */
    consentedAt: timestamp("consented_at").notNull().defaultNow(),
    /** 동의 시점 IP 주소 */
    ipAddress: text("ip_address"),
    /** 브라우저/디바이스 정보 */
    userAgent: varchar("user_agent", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("uniq_policy_consent_user_id_policy_version_id").on(
      t.userId,
      t.policyVersionId,
    ),
  ],
);
