import { getOrders, Order } from "@/app/actions/order";
import OrderManagement from "@/component/orderManagement/OrderManagement";

const OrdersPage = async () => {
  const response = await getOrders(1, 20); // Default page 1, limit 20

  const initialOrders = (response.success && response.data ? response.data : []) as Order[];
  const pagination = response.pagination;

  return <OrderManagement initialOrders={initialOrders} pagination={pagination} />;
};

export default OrdersPage;