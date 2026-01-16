import { Customer, getCustomers } from "@/app/actions/customer";
import { getOrderById, Order } from "@/app/actions/order";
import { getProducts, Product } from "@/app/actions/product";
import OrderEdit from "@/component/orderManagement/OrderEdit";
import { redirect } from "next/navigation";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  
  const [orderRes, customersRes, productsRes] = await Promise.all([
    getOrderById(resolvedParams.id),
    getCustomers(1, 100),
    getProducts(1, 100)
  ]);
  
  if (!orderRes.success || !orderRes.data) {
      redirect("/orders");
  }

  const order = orderRes.data as Order;
  const customersList = (customersRes.success && customersRes.data ? customersRes.data : []) as Customer[];
  const productsList = (productsRes.success && productsRes.data ? productsRes.data : []) as Product[];

  return <OrderEdit order={order} customersList={customersList} productsList={productsList} />;
}
