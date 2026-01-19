import { categoryService } from "@service/solves";
import { nextOk } from "@/lib/protocol/next-route-helper";

export const revalidate = 30; // 30초
// // 30분(1800초) 동안 캐싱 후 revalidate
// export const revalidate = 1800;

export async function GET() {
  const categories = await categoryService.getAllCategories();

  return nextOk(categories);
}
