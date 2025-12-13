"use client";
import { Category, deleteCategory, getCategories } from "@/app/actions/category";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaEdit,
  FaFolder,
  FaPlus,
  FaSearch,
  FaTrash,
} from "react-icons/fa";

interface CategoryManagementProps {
  initialCategories: Category[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const CategoryManagement = ({
  initialCategories,
  pagination: initialPagination,
}: CategoryManagementProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: isDarkMode
        ? "bg-green-900 text-green-300"
        : "bg-green-100 text-green-800",
      inactive: isDarkMode
        ? "bg-red-900 text-red-300"
        : "bg-red-100 text-red-800",
    };
    return colors[status] || "";
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    setLoading(true);
    const response = await getCategories(1, 20, term);
    if (response.success && response.data) {
      setCategories(response.data as Category[]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      const response = await deleteCategory(id);
      if (response.success) {
        toast.success("Category deleted successfully");
        setCategories(categories.filter((c) => c._id !== id));
        router.refresh();
      } else {
        toast.error(response.error || "Failed to delete category");
      }
    }
  };

  return (
    <div
      className={`min-h-screen p-6 ${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Categories</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Organize your products with categories
        </p>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <FaSearch
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-gray-100"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>

        {/* Add Category Button */}
        <Link
          href="/categories/add-categories"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
        >
          <FaPlus /> Add Category
        </Link>
      </div>

      {/* Categories Table (List View) */}
      <div
        className={`rounded-lg shadow-sm border overflow-hidden ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-6 text-center">Loading categories...</div>
          ) : (
          <table className="w-full">
            <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {categories.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                        <FaFolder className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                        <p className="text-gray-500">No categories found</p>
                    </td>
                  </tr>
              )}
              {categories.map((category) => (
                <tr
                  key={category._id}
                  className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{category.name}</div>
                    {category.parent && typeof category.parent === 'object' && (
                        <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Parent: {category.parent.name}
                        </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-mono text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {category.slug}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm truncate max-w-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {category.description || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold">{category.productsCount || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(category.status)}`}>
                      {category.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(category.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/categories/edit-categories/${category._id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FaEdit />
                      </Link>
                      <button
                        onClick={() => handleDelete(category._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;