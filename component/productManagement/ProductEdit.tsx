"use client";
import { Category } from "@/app/actions/category";
import { Product, updateProduct } from "@/app/actions/product";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import ProductForm, { ProductFormData } from "./ProductForm";

interface ProductEditProps {
  product: Product;
  categoriesList: Category[];
}

const ProductEdit = ({ product, categoriesList }: ProductEditProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map Product to ProductFormData
  const initialData: ProductFormData = {
    name: product.name,
    sku: product.sku,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    category: product.category && typeof product.category === 'object' ? product.category._id : (product.category as string || ""), // Handle populated category
    status: product.status,
    description: product.description,
    images: [], // New files are empty
    existingImages: product.images?.map(img => img.url) || [],
    featured: product.featured,
  };

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

        // Append kept existing images
        if (data.existingImages && data.existingImages.length > 0) {
            data.existingImages.forEach(url => {
                 formData.append("keptImages", url);
            });
        }

        // Append new images
        data.images.forEach((file) => {
            formData.append("images", file);
        });

        const response = await updateProduct(product._id, formData);

        if (response.success) {
            toast.success("Product updated successfully!");
            router.push("/products");
            router.refresh();
        } else {
            toast.error(response.error || "Failed to update product");
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
      title="Edit Product"
      initialData={initialData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      categoriesList={categoriesList}
    />
  );
};

export default ProductEdit;