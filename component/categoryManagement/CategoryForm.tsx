"use client";
import { Category } from "@/app/actions/category";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaSave, FaTimes } from "react-icons/fa";

export interface CategoryFormData {
  name: string;
  description?: string;
  parent?: string;
  status: "active" | "inactive";
}

interface CategoryFormProps {
  initialData?: CategoryFormData;
  onSubmit: (data: CategoryFormData) => void;
  title: string;
  isSubmitting?: boolean;
  categoriesList?: Category[];
}

const CategoryForm = ({
  initialData,
  onSubmit,
  title,
  isSubmitting = false,
  categoriesList = [],
}: CategoryFormProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();

  const [formData, setFormData] = useState<CategoryFormData>(
    initialData || {
      name: "",
      description: "",
      parent: "",
      status: "active",
    }
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputClass = `w-full px-4 py-2 rounded-lg border ${
    isDarkMode
      ? "bg-gray-800 border-gray-700 text-gray-100"
      : "bg-white border-gray-300 text-gray-900"
  } focus:outline-none focus:ring-2 focus:ring-blue-500`;

  const labelClass = `block text-sm font-medium mb-1 ${
    isDarkMode ? "text-gray-400" : "text-gray-700"
  }`;

  return (
    <div
      className={`min-h-screen p-6 ${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            {initialData ? "Update category information" : "Add a new category to your store"}
          </p>
        </div>
        <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                 isDarkMode
                  ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FaTimes /> Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FaSave /> {isSubmitting ? "Saving..." : "Save Category"}
            </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div
            className={`p-6 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">
              General Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Category Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Electronics"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`${inputClass} h-32`}
                  placeholder="Category description..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Status Card */}
          <div
            className={`p-6 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Hierarchy Card */}
          <div
            className={`p-6 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">Hierarchy</h2>
            <div>
              <label className={labelClass}>Parent Category</label>
              <select
                name="parent"
                value={formData.parent}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">None (Top Level)</option>
                {categoriesList.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Select a parent category to create a subcategory.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;
