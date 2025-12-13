import { Category, getCategories } from "@/app/actions/category";
import CategoryAdd from "@/component/categoryManagement/CategoryAdd";

const AddCategoryPage = async () => {
  const response = await getCategories(1, 100, "", "active");
  const categoriesList = (response.success && response.data ? response.data : []) as Category[];

  return <CategoryAdd categoriesList={categoriesList} />;
};

export default AddCategoryPage;
