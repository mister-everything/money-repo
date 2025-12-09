import z from "zod";

export enum Role {
  USER = "user",
  ADMIN = "admin",
}

export const RoleSchema = z.enum(Object.values(Role));

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
