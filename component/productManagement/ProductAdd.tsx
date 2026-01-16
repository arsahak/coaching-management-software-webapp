"use client";
import { Category } from "@/app/actions/category";
import { createProduct } from "@/app/actions/product";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import ProductForm, { ProductFormData } from "./ProductForm";

interface ProductAddProps {
  categoriesList: Category[];
}

const ProductAdd = ({ categoriesList }: ProductAddProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("sku", data.sku);
      formData.append("price", data.price.toString());
      if (data.compareAtPrice) formData.append("compareAtPrice", data.compareAtPrice.toString());
      formData.append("stock", data.stock.toString());
      formData.append("category", data.category);
      formData.append("status", data.status);
      formData.append("description", data.description);
      formData.append("featured", data.featured.toString());
      
      // Append images
      data.images.forEach((file) => {
          formData.append("images", file);
      });

      const response = await createProduct(formData);

      if (response.success) {
          toast.success("Product created successfully!");
          router.push("/products");
      } else {
          toast.error(response.error || "Failed to create product");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProductForm
      title="Add New Product"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      categoriesList={categoriesList}
    />
  );
};

export default ProductAdd;
