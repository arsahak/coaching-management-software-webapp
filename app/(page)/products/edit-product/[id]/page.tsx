import { Category, getCategories } from "@/app/actions/category";
import { getProductById, Product } from "@/app/actions/product";
import ProductEdit from "@/component/productManagement/ProductEdit";
import { redirect } from "next/navigation";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  
  const [productRes, categoriesRes] = await Promise.all([
    getProductById(resolvedParams.id),
    getCategories(1, 100, "", "active")
  ]);
  
  if (!productRes.success || !productRes.data) {
      redirect("/products");
  }

  const product = productRes.data as Product;
  const categoriesList = (categoriesRes.success && categoriesRes.data ? categoriesRes.data : []) as Category[];

  return <ProductEdit product={product} categoriesList={categoriesList} />;
}
