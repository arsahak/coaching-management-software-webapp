import { getProductById, Product } from "@/app/actions/product";
import ProductDetails from "@/component/productManagement/ProductDetails";
import { redirect } from "next/navigation";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const response = await getProductById(resolvedParams.id);
  
  if (!response.success || !response.data) {
     redirect("/products");
  }

  return <ProductDetails product={response.data as Product} />;
}
