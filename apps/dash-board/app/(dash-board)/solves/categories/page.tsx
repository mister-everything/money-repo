import { categoryService } from "@service/solves";

import { CategoryTabs } from "@/components/solves/category-tabs";

export const dynamic = "force-dynamic";

export default async function CategoryManagePage() {
  const categories = await categoryService.getAllCategoriesWithSubs();

  return (
    <main className="flex flex-1 flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold leading-tight">카테고리 관리</h1>
      </header>

      <CategoryTabs categories={categories} />
    </main>
  );
}
