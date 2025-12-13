"use client";
import { createCategory, Category } from "@/app/actions/category";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import CategoryForm, { CategoryFormData } from "./CategoryForm";

interface CategoryAddProps {
  categoriesList: Category[];
}

const CategoryAdd = ({ categoriesList }: CategoryAddProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    
    try {
        // Only send parent if it's not empty string
        const payload = {
            ...data,
            parent: data.parent === "" ? undefined : data.parent
        };

        const response = await createCategory(payload);

        if (response.success) {
            toast.success("Category created successfully!");
            router.push("/categories");
            router.refresh();
        } else {
            toast.error(response.error || "Failed to create category");
        }
    } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <CategoryForm
      title="Add New Category"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      categoriesList={categoriesList}
    />
  );
};

export default CategoryAdd;