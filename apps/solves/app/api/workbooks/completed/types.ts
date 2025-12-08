import z from "zod";

export const SearchCompletedWorkbooksRequest = z.object({
  page: z.number().default(1).optional(),
  limit: z.number().default(30).optional(),
  sort: z.enum(["latest", "highest", "lowest"]).default("latest").optional(),
  search: z.string().optional(),
});
