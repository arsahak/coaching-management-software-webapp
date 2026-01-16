"use client";
import { Customer, deleteCustomer, getCustomers } from "@/app/actions/customer";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  FaEdit,
  FaPlus,
  FaSearch,
  FaTrash,
  FaUser,
} from "react-icons/fa";

interface CustomerManagementProps {
  initialCustomers: Customer[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const CustomerManagement = ({
  initialCustomers,
  pagination: initialPagination,
}: CustomerManagementProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    setLoading(true);
    const response = await getCustomers(1, 20, term);
    if (response.success && response.data) {
      setCustomers(response.data as Customer[]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      const response = await deleteCustomer(id);
      if (response.success) {
        toast.success("Customer deleted successfully");
        setCustomers(customers.filter((c) => c._id !== id));
        router.refresh();
      } else {
        toast.error(response.error || "Failed to delete customer");
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
        <h1 className="text-3xl font-bold mb-2">Customers</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Manage your customer base
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
              placeholder="Search customers..."
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

        {/* Add Customer Button */}
        <Link
          href="/customers/add-customer"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
        >
          <FaPlus /> Add Customer
        </Link>
      </div>

      {/* Customers Table */}
      <div
        className={`rounded-lg shadow-sm border overflow-hidden ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-6 text-center">Loading customers...</div>
          ) : (
          <table className="w-full">
            <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {customers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                        <FaUser className={`mx-auto text-4xl mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                        <p className="text-gray-500">No customers found</p>
                    </td>
                  </tr>
              )}
              {customers.map((customer) => (
                <tr
                  key={customer._id}
                  className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                            {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-medium">{customer.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                      {customer.email}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                      {customer.phone || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold">{customer.totalOrders || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-green-600">
                      {formatCurrency(customer.totalSpent)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(customer.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/customers/edit-customer/${customer._id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FaEdit />
                      </Link>
                      <button
                        onClick={() => handleDelete(customer._id)}
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

        {/* Pagination */}
        <div
          className={`px-6 py-4 flex items-center justify-between border-t ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Showing 1 to {customers.length} of {initialPagination?.total || customers.length} customers
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

export default CustomerManagement;