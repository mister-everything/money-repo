import z from "zod";

export enum Role {
  USER = "user",
  ADMIN = "admin",
}

export const RoleSchema = z.enum(Object.values(Role));

export type Owner = {
  // id: string; 사용자 아이디는 보안상 노출하지 않음
  name: string;
  profile?: string;
};

export type Invitation = {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  usedBy: string | null;
  usedByUser: {
    name: string;
    email: string;
  } | null;
};
