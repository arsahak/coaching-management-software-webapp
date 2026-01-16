import { Customer, getCustomers } from "@/app/actions/customer";
import { getProducts, Product } from "@/app/actions/product";
import OrderAdd from "@/component/orderManagement/OrderAdd";

const CreateOrderPage = async () => {
  const [customersRes, productsRes] = await Promise.all([
    getCustomers(1, 100),
    getProducts(1, 100)
  ]);

  const customersList = (customersRes.success && customersRes.data ? customersRes.data : []) as Customer[];
  const productsList = (productsRes.success && productsRes.data ? productsRes.data : []) as Product[];

  return <OrderAdd customersList={customersList} productsList={productsList} />;
};

export default CreateOrderPage;
