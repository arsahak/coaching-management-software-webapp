import { getProductById, Product } from "@/app/actions/product";
import UpdateStockForm from "@/component/inventoryManagement/UpdateStockForm";
import { redirect } from "next/navigation";

export default async function UpdateStockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const response = await getProductById(resolvedParams.id);
  
  if (!response.success || !response.data) {
      redirect("/inventory");
  }

  return <UpdateStockForm product={response.data as Product} />;
}
