import { getOrderById, Order } from "@/app/actions/order";
import OrderDetails from "@/component/orderManagement/OrderDetails";
import { redirect } from "next/navigation";

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const response = await getOrderById(resolvedParams.id);
  
  if (!response.success || !response.data) {
      redirect("/orders");
  }

  return <OrderDetails order={response.data as Order} />;
}