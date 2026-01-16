"use client";
import { deleteProduct, getProducts, Product } from "@/app/actions/product";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaBox,
  FaEdit,
  FaEye,
  FaPlus,
  FaSearch,
  FaTrash,
} from "react-icons/fa";
import { MdInventory } from "react-icons/md";

interface ProductManagementProps {
  initialProducts: Product[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const ProductManagement = ({
  initialProducts,
  pagination: initialPagination,
}: ProductManagementProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);

  // Stats calculation
  const totalProducts = products.length; // This is only for current page, ideally should come from stats API
  const activeProducts = products.filter((p) => p.status === "active").length;
  const lowStockProducts = products.filter((p) => p.stock <= 10 && p.stock > 0).length;
  const outOfStockProducts = products.filter((p) => p.stock === 0).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return { label: "Out of Stock", color: "text-red-600 bg-red-100" };
    } else if (stock <= 10) {
      return { label: "Low Stock", color: "text-yellow-600 bg-yellow-100" };
    } else {
      return { label: "In Stock", color: "text-green-600 bg-green-100" };
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: isDarkMode
        ? "bg-green-900 text-green-300"
        : "bg-green-100 text-green-800",
      draft: isDarkMode
        ? "bg-gray-700 text-gray-300"
        : "bg-gray-100 text-gray-800",
      archived: isDarkMode
        ? "bg-red-900 text-red-300"
        : "bg-red-100 text-red-800",
    };
    return colors[status] || "";
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    setLoading(true);
    // In a real app, debounce this
    const response = await getProducts(1, 20, term);
    if (response.success && response.data) {
      setProducts(response.data as Product[]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const response = await deleteProduct(id);
      if (response.success) {
        toast.success("Product deleted successfully");
        // Refresh list
        setProducts(products.filter((p) => p._id !== id));
        router.refresh();
      } else {
        toast.error(response.error || "Failed to delete product");
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
        <h1 className="text-3xl font-bold mb-2">Products</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Manage your product inventory
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
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-gray-100"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700 text-gray-100"
                : "bg-white border-gray-300 text-gray-900"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Add Product Button */}
        <Link
          href="/products/add-product"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
        >
          <FaPlus /> Add Product
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div
          className={`p-4 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Total Products
              </p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
            <FaBox className="text-blue-500 text-3xl" />
          </div>
        </div>
        <div
          className={`p-4 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Active
              </p>
              <p className="text-2xl font-bold text-green-500">{activeProducts}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 text-lg font-bold">✓</span>
            </div>
          </div>
        </div>
        <div
          className={`p-4 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Low Stock
              </p>
              <p className="text-2xl font-bold text-yellow-500">{lowStockProducts}</p>
            </div>
            <MdInventory className="text-yellow-500 text-3xl" />
          </div>
        </div>
        <div
          className={`p-4 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Out of Stock
              </p>
              <p className="text-2xl font-bold text-red-500">{outOfStockProducts}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-lg font-bold">!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div
        className={`rounded-lg shadow-sm border overflow-hidden ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-6 text-center">Loading products...</div>
          ) : (
          <table className="w-full">
            <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDarkMode ? "divide-gray-700" : "divide-gray-200"
              }`}
            >
              {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">No products found.</td>
                  </tr>
              )}
              {products.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                const primaryImage = product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url;
                const categoryName = product.category && typeof product.category === 'object' ? product.category.name : (product.category || "Uncategorized");

                return (
                  <tr
                    key={product._id}
                    className={
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-md bg-gray-200 overflow-hidden relative">
                           {primaryImage && (
                              <img src={primaryImage} alt={product.name} className="w-full h-full object-cover"/>
                           )}
                           {!primaryImage && <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium">{product.name}</div>
                          {product.featured && (
                            <span className="text-xs text-yellow-500">
                              ★ Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`font-mono text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {product.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium">
                          {formatCurrency(product.price)}
                        </div>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <div
                            className={`text-sm line-through ${
                              isDarkMode ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            {formatCurrency(product.compareAtPrice)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium">{product.stock}</div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${stockStatus.color}`}
                        >
                          {stockStatus.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }
                      >
                        {categoryName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                          product.status
                        )}`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${product._id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FaEye />
                        </Link>
                        <Link
                          href={`/products/edit-product/${product._id}`}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>

        {/* Pagination */}
        <div
          className={`px-6 py-4 flex items-center justify-between border-t ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Showing {initialPagination?.page || 1} of {initialPagination?.pages || 1} pages
          </div>
          <div className="flex gap-2">
            <button
              disabled={!initialPagination || initialPagination.page <= 1}
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "border-gray-700 hover:bg-gray-700 disabled:opacity-50"
                  : "border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              }`}
            >
              Previous
            </button>
            <button
              disabled={!initialPagination || initialPagination.page >= initialPagination.pages}
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "border-gray-700 hover:bg-gray-700 disabled:opacity-50"
                  : "border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
