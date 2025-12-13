import { Category, getCategories } from "@/app/actions/category";
import ProductAdd from "@/component/productManagement/ProductAdd";

const AddProductPage = async () => {
  const response = await getCategories(1, 100, "", "active");
  const categoriesList = (response.success && response.data ? response.data : []) as Category[];

  return <ProductAdd categoriesList={categoriesList} />;
};

export default AddProductPage;
