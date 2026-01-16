import { getProducts, Product } from "@/app/actions/product";
import InventoryManagement from "@/component/inventoryManagement/InventoryManagement";

const InventoryPage = async () => {
  const response = await getProducts(1, 20); // Default pagination
  const initialProducts = (response.success && response.data ? response.data : []) as Product[];
  const pagination = response.pagination;

  return <InventoryManagement initialProducts={initialProducts} pagination={pagination} />;
};

export default InventoryPage;