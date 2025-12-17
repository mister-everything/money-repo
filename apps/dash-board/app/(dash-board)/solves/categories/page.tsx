import { categoryService } from "@service/solves";
import { CategoryTabs } from "./category-tabs";

export default async function CategoryManagePage() {
  const categories = await categoryService.getAllCategories();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">소재 관리</h1>
          <p className="text-muted-foreground mt-2">
            소재를 추가, 수정, 삭제할 수 있습니다.
          </p>
        </div>
      </div>
      <CategoryTabs categories={categories} />
    </div>
  );
}
