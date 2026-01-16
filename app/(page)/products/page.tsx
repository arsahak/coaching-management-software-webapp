import { getProducts, Product } from "@/app/actions/product";
import ProductManagement from "@/component/productManagement/ProductManagement";

const ProductsPage = async () => {
  const response = await getProducts(1, 20); // Default page 1, limit 20

  const initialProducts = (response.success && response.data ? response.data : []) as Product[];
  const pagination = response.pagination;

  return <ProductManagement initialProducts={initialProducts} pagination={pagination} />;
};

export default ProductsPage;