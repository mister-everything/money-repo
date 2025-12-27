"use client";
import { Role } from "@service/auth/shared";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: Object.values(Role),
          required: false,
          defaultValue: Role.USER,
          input: false,
        },
        nickname: {
          type: "string",
          required: false,
          defaultValue: null,
          input: true,
        },
        publicId: {
          type: "number",
          input: false,
        },
        consentedAt: {
          type: "date",
          required: false,
          defaultValue: null,
          input: false,
        },
      },
    }),
  ],
});
