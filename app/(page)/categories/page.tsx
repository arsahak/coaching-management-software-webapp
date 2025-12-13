import { Category, getCategories } from "@/app/actions/category";
import CategoryManagement from "@/component/categoryManagement/CategoryManagement";

const CategoriesPage = async () => {
  const response = await getCategories(1, 20); // Default page 1, limit 20

  const initialCategories = (response.success && response.data ? response.data : []) as Category[];
  const pagination = response.pagination;

  return <CategoryManagement initialCategories={initialCategories} pagination={pagination} />;
};

export default CategoriesPage;