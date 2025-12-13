import { Category, getCategories, getCategoryById } from "@/app/actions/category";
import CategoryEdit from "@/component/categoryManagement/CategoryEdit";
import { redirect } from "next/navigation";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  
  // Parallel fetching
  const [categoryRes, categoriesRes] = await Promise.all([
    getCategoryById(resolvedParams.id),
    getCategories(1, 100, "", "active")
  ]);
  
  if (!categoryRes.success || !categoryRes.data) {
      redirect("/categories");
  }

  const category = categoryRes.data as Category;
  const categoriesList = (categoriesRes.success && categoriesRes.data ? categoriesRes.data : []) as Category[];

  return <CategoryEdit category={category} categoriesList={categoriesList} />;
}