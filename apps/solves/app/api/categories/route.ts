import { categoryService } from "@service/solves";
import { nextOk } from "@/lib/protocol/next-route-helper";

export const revalidate = 1800; // 30분

export async function GET() {
  const categories = await categoryService.getAllCategories();

  return nextOk(categories);
}
