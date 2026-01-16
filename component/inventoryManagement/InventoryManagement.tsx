"use client";
import { getProducts, Product } from "@/app/actions/product";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import React, { useState } from "react";
import {
  FaBoxOpen,
  FaExclamationTriangle,
  FaSearch,
  FaWarehouse,
} from "react-icons/fa";
import { MdInventory } from "react-icons/md";

interface InventoryManagementProps {
  initialProducts: Product[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const InventoryManagement = ({ initialProducts, pagination }: InventoryManagementProps) => {
  const { isDarkMode } = useSidebar();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInventoryStatus = (product: Product) => {
    if (product.stock === 0) return "out_of_stock";
    if (product.stock <= (product.lowStockThreshold || 10)) return "low_stock";
    return "in_stock";
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; color: string; icon: React.ReactNode }
    > = {
      in_stock: {
        label: "In Stock",
        color: isDarkMode
          ? "bg-green-900 text-green-300"
          : "bg-green-100 text-green-800",
        icon: <FaBoxOpen />,
      },
      low_stock: {
        label: "Low Stock",
        color: isDarkMode
          ? "bg-yellow-900 text-yellow-300"
          : "bg-yellow-100 text-yellow-800",
        icon: <FaExclamationTriangle />,
      },
      out_of_stock: {
        label: "Out of Stock",
        color: isDarkMode
          ? "bg-red-900 text-red-300"
          : "bg-red-100 text-red-800",
        icon: <FaExclamationTriangle />,
      },
    };
    return statusMap[status] || statusMap.in_stock;
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    setLoading(true);
    const response = await getProducts(1, 20, term);
    if (response.success && response.data) {
      setProducts(response.data as Product[]);
    }
    setLoading(false);
  };

  // Basic stats from current page data (ideally from API)
  const totalItems = pagination?.total || products.length;
  // These are only for current page, simpler than fetching stats separately for now
  const inStock = products.filter((p) => getInventoryStatus(p) === "in_stock").length;
  const lowStock = products.filter((p) => getInventoryStatus(p) === "low_stock").length;
  const outOfStock = products.filter((p) => getInventoryStatus(p) === "out_of_stock").length;
  const totalValue = products.reduce((sum, item) => sum + item.stock * item.price, 0);

  return (
    <div
      className={`min-h-screen p-6 ${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Track and manage your stock levels
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div
          className={`p-4 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <MdInventory className="text-2xl text-blue-500" />
            <span className="text-2xl font-bold">{totalItems}</span>
          </div>
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Total Items
          </p>
        </div>
        <div
          className={`p-4 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <FaBoxOpen className="text-2xl text-green-500" />
            <span className="text-2xl font-bold text-green-500">{inStock}</span>
          </div>
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            In Stock (Page)
          </p>
        </div>
        <div
          className={`p-4 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <FaExclamationTriangle className="text-2xl text-yellow-500" />
            <span className="text-2xl font-bold text-yellow-500">
              {lowStock}
            </span>
          </div>
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Low Stock (Page)
          </p>
        </div>
        <div
          className={`p-4 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <FaExclamationTriangle className="text-2xl text-red-500" />
            <span className="text-2xl font-bold text-red-500">
              {outOfStock}
            </span>
          </div>
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Out of Stock (Page)
          </p>
        </div>
        <div
          className={`p-4 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <FaWarehouse className="text-2xl text-purple-500" />
            <span className="text-lg font-bold text-purple-500">
              {formatCurrency(totalValue)}
            </span>
          </div>
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Total Value (Page)
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <FaSearch
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700 text-gray-100"
                : "bg-white border-gray-300 text-gray-900"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>

        {/* Status Filter */}
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
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div
        className={`rounded-lg shadow-sm border overflow-hidden ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-6 text-center">Loading inventory...</div>
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
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Threshold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Last Updated
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
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                        No inventory items found.
                    </td>
                  </tr>
              )}
              {products.map((item) => {
                const status = getInventoryStatus(item);
                const statusInfo = getStatusInfo(status);
                const categoryName = item.category && typeof item.category === 'object' ? item.category.name : (item.category || "Uncategorized");

                return (
                  <tr
                    key={item._id}
                    className={
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`font-mono text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {item.sku}
                      </span>
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
                      <span className="font-semibold text-lg">
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }
                      >
                        {item.lowStockThreshold || 10}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`flex items-center gap-2 px-2 py-1 text-xs rounded-full w-fit ${statusInfo.color}`}
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold">
                        {formatCurrency(item.stock * item.price)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }
                      >
                        {formatDate(item.updatedAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/inventory/update-stock/${item._id}`}
                        className="inline-block px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Update Stock
                      </Link>
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
            Showing 1 to {products.length} of {pagination?.total || products.length} items
          </div>
          <div className="flex gap-2">
            <button
              disabled={!pagination || pagination.page <= 1}
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "border-gray-700 hover:bg-gray-700 disabled:opacity-50"
                  : "border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              }`}
            >
              Previous
            </button>
            <button
              disabled={!pagination || pagination.page >= pagination.pages}
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

export default InventoryManagement;