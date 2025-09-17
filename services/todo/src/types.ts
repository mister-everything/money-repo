import { z } from "zod";

export type Todo = {
  id: number;
  title: string;
  done: boolean;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

export const todoSaveSchema = z.object({
  id: z.number().optional(),
  title: z.string(),
  done: z.boolean(),
  description: z.string(),
});
