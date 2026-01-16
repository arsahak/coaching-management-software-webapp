"use client";
import { useSidebar } from "@/lib/SidebarContext";
import {
  FaBox,
  FaMoneyBillWave,
  FaShoppingCart,
  FaUserPlus,
  FaUsers,
} from "react-icons/fa";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsProps {
  orderStats: {
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    revenue: number;
  };
  customerStats: {
    totalCustomers: number;
    newCustomersThisMonth: number;
    topCustomers: any[];
  };
  recentOrders: any[];
}

const AnalyticsManagement = ({
  orderStats,
  customerStats,
  recentOrders,
}: AnalyticsProps) => {
  const { isDarkMode } = useSidebar();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Prepare data for Order Status Pie Chart
  const statusData = [
    { name: "Pending", value: orderStats.pendingOrders, color: "#F59E0B" },
    { name: "Processing", value: orderStats.processingOrders, color: "#3B82F6" },
    { name: "Shipped", value: orderStats.shippedOrders, color: "#8B5CF6" },
    { name: "Delivered", value: orderStats.deliveredOrders, color: "#10B981" },
    { name: "Cancelled", value: orderStats.cancelledOrders, color: "#EF4444" },
  ].filter((item) => item.value > 0);

  // Prepare data for recent orders chart (mock trend based on recent orders if possible, or static)
  // For now, let's just show the distribution as the main chart.

  const StatCard = ({
    title,
    value,
    icon,
    colorClass,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    colorClass: string;
  }) => (
    <div
      className={`p-6 rounded-lg border ${
        isDarkMode
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          {title}
        </h3>
        <div className={`p-3 rounded-full ${colorClass} bg-opacity-10`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );

  return (
    <div
      className={`min-h-screen p-6 ${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Overview of your store's performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(orderStats.revenue)}
          icon={<FaMoneyBillWave className="text-green-500" />}
          colorClass="bg-green-500"
        />
        <StatCard
          title="Total Orders"
          value={orderStats.totalOrders}
          icon={<FaShoppingCart className="text-blue-500" />}
          colorClass="bg-blue-500"
        />
        <StatCard
          title="Total Customers"
          value={customerStats.totalCustomers}
          icon={<FaUsers className="text-purple-500" />}
          colorClass="bg-purple-500"
        />
        <StatCard
          title="New Customers (Mo.)"
          value={customerStats.newCustomersThisMonth}
          icon={<FaUserPlus className="text-yellow-500" />}
          colorClass="bg-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Order Status Chart */}
        <div
          className={`p-6 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <h3 className="text-xl font-bold mb-6">Order Status Distribution</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                    borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                    color: isDarkMode ? "#F3F4F6" : "#111827",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Customers */}
        <div
          className={`p-6 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <h3 className="text-xl font-bold mb-6">Top Customers</h3>
          <div className="space-y-4">
            {customerStats.topCustomers.map((customer, index) => (
              <div
                key={customer._id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{customer.name}</p>
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {customer.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-500">
                    {formatCurrency(customer.totalSpent)}
                  </p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {customer.totalOrders} orders
                  </p>
                </div>
              </div>
            ))}
            {customerStats.topCustomers.length === 0 && (
                <p className="text-center text-gray-500">No customers yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div
        className={`rounded-lg border overflow-hidden ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDarkMode ? "divide-gray-700" : "divide-gray-200"
              }`}
            >
              {recentOrders.map((order) => (
                <tr
                  key={order._id}
                  className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}
                >
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(order.orderDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        order.orderStatus === "delivered"
                          ? "bg-green-100 text-green-800"
                          : order.orderStatus === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                    {formatCurrency(order.total)}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                  <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          No recent orders.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsManagement;
