import { categoryService } from "@service/solves";
import { nextOk } from "@/lib/protocol/next-route-helper";

export async function GET() {
  const categories = await categoryService.getAllCategories();

  return nextOk(categories);
}
