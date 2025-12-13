"use client";
import { Category, updateCategory } from "@/app/actions/category";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import CategoryForm, { CategoryFormData } from "./CategoryForm";

interface CategoryEditProps {
  category: Category;
  categoriesList: Category[];
}

const CategoryEdit = ({ category, categoriesList }: CategoryEditProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map Category to CategoryFormData
  const initialData: CategoryFormData = {
    name: category.name,
    description: category.description || "",
    parent: typeof category.parent === 'object' ? category.parent?._id : (category.parent as string) || "",
    status: category.status,
  };

  const handleSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    
    try {
        const payload = {
            ...data,
            parent: data.parent === "" ? undefined : data.parent
        };

        const response = await updateCategory(category._id, payload);

        if (response.success) {
            toast.success("Category updated successfully!");
            router.push("/categories");
            router.refresh();
        } else {
            toast.error(response.error || "Failed to update category");
        }
    } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  // Filter out the category itself from parent options (to prevent circular ref)
  const validParents = categoriesList.filter(c => c._id !== category._id);

  return (
    <CategoryForm
      title="Edit Category"
      initialData={initialData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      categoriesList={validParents}
    />
  );
};

export default CategoryEdit;