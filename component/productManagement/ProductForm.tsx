"use client";
import { Category } from "@/app/actions/category";
import { useSidebar } from "@/lib/SidebarContext";
import { useRef, useState } from "react";
import { FaSave, FaTimes, FaUpload, FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation";

export interface ProductFormData {
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  category: string;
  status: "active" | "draft" | "archived";
  description: string;
  images: File[];
  existingImages?: string[]; // URLs
  featured: boolean;
}

interface ProductFormProps {
  initialData?: ProductFormData;
  onSubmit: (data: ProductFormData) => void;
  title: string;
  isSubmitting?: boolean;
  categoriesList?: Category[];
}

const ProductForm = ({
  initialData,
  onSubmit,
  title,
  isSubmitting = false,
  categoriesList = [],
}: ProductFormProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProductFormData>(
    initialData || {
      name: "",
      sku: "",
      price: 0,
      compareAtPrice: 0,
      stock: 0,
      category: "",
      status: "draft",
      description: "",
      images: [],
      existingImages: [],
      featured: false,
    }
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? parseFloat(value)
          : type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newFiles],
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeExistingImage = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      existingImages: prev.existingImages?.filter((img) => img !== url) || [],
    }));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
            {initialData ? "Update product information" : "Add a new product to your inventory"}
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
              <FaSave /> {isSubmitting ? "Saving..." : "Save Product"}
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
                <label className={labelClass}>Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Wireless Headphones"
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
                  placeholder="Product description..."
                />
              </div>
            </div>
          </div>

          {/* Media Card */}
          <div
            className={`p-6 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">Media</h2>
            <div
              onClick={handleUploadClick}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-opacity-50 transition-colors ${
                isDarkMode
                  ? "border-gray-700 bg-gray-900 hover:bg-gray-800"
                  : "border-gray-300 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <FaUpload className="mx-auto text-4xl mb-2 text-gray-400" />
              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                Drag and drop images here, or click to upload
              </p>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" 
                multiple 
                accept="image/*"
              />
            </div>
             {/* Preview Images */}
            {(formData.existingImages?.length || 0) > 0 || formData.images.length > 0 ? (
              <div className="mt-4 grid grid-cols-4 gap-4">
                {/* Existing Images */}
                {formData.existingImages?.map((url, idx) => (
                  <div key={`existing-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                    <img
                      src={url}
                      alt={`existing ${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(url)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTrash size={12} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                        Existing
                    </div>
                  </div>
                ))}
                {/* New Files */}
                {formData.images.map((file, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`preview ${idx}`}
                      className="w-full h-full object-cover"
                    />
                     <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTrash size={12} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-green-600 bg-opacity-70 text-white text-xs p-1 text-center">
                        New
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Pricing Card */}
          <div
            className={`p-6 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Base Price</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className={inputClass}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Compare at Price</label>
                <input
                  type="number"
                  name="compareAtPrice"
                  value={formData.compareAtPrice}
                  onChange={handleChange}
                  className={inputClass}
                  min="0"
                  step="0.01"
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
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
            
            <div className="mt-4 flex items-center">
               <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleCheckboxChange}
                id="featured"
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="featured" className={`ml-2 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Featured Product</label>
            </div>
          </div>

          {/* Inventory Card */}
          <div
            className={`p-6 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">Inventory</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>SKU (Stock Keeping Unit)</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Quantity</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className={inputClass}
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Category Card */}
          <div
            className={`p-6 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">Category</h2>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={inputClass}
              required
            >
              <option value="">Select Category</option>
              {categoriesList.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {categoriesList.length === 0 && (
                <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    No categories found. Please create a category first.
                </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
