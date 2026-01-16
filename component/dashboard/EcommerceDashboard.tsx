"use client";
import { useSidebar } from "@/lib/SidebarContext";
import {
  FaBoxOpen,
  FaDollarSign,
  FaShoppingCart,
  FaUsers,
} from "react-icons/fa";
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardData {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    revenueGrowth: number;
    ordersGrowth: number;
    productsGrowth: number;
    customersGrowth: number;
    pendingOrders: number;
    lowStockProducts: number;
  };
  recentOrders: any[];
  topProducts: any[];
  salesData: any[];
}

interface EcommerceDashboardProps {
  data: DashboardData;
  session?: string;
}

const EcommerceDashboard = ({ data, session }: EcommerceDashboardProps) => {
  const { isDarkMode } = useSidebar();
  const { stats, recentOrders, topProducts, salesData } = data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: isDarkMode
        ? "bg-yellow-900 text-yellow-300"
        : "bg-yellow-100 text-yellow-800",
      processing: isDarkMode
        ? "bg-blue-900 text-blue-300"
        : "bg-blue-100 text-blue-800",
      shipped: isDarkMode
        ? "bg-purple-900 text-purple-300"
        : "bg-purple-100 text-purple-800",
      delivered: isDarkMode
        ? "bg-green-900 text-green-300"
        : "bg-green-100 text-green-800",
      cancelled: isDarkMode
        ? "bg-red-900 text-red-300"
        : "bg-red-100 text-red-800",
    };
    return (
      colors[status] ||
      (isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800")
    );
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: stats?.totalRevenue,
      format: formatCurrency,
      growth: stats?.revenueGrowth || 0,
      icon: FaDollarSign,
      color: isDarkMode ? "bg-green-900" : "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders,
      format: (val: number) => val.toString(),
      growth: stats?.ordersGrowth || 0,
      icon: FaShoppingCart,
      color: isDarkMode ? "bg-blue-900" : "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Products",
      value: stats?.totalProducts,
      format: (val: number) => val.toString(),
      growth: stats?.productsGrowth || 0,
      icon: FaBoxOpen,
      color: isDarkMode ? "bg-purple-900" : "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Customers",
      value: stats?.totalCustomers,
      format: (val: number) => val.toString(),
      growth: stats?.customersGrowth || 0,
      icon: FaUsers,
      color: isDarkMode ? "bg-orange-900" : "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div
      className={`min-h-screen p-6 ${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {session || "Admin"}! 👋
        </h1>
        <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
          Here's what's happening with your store today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`rounded-lg p-6 shadow-sm border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <div className="flex items-center gap-1">
                {card.growth >= 0 ? (
                  <FaArrowTrendUp className="text-green-500 w-4 h-4" />
                ) : (
                  <FaArrowTrendDown className="text-red-500 w-4 h-4" />
                )}
                <span
                  className={`text-sm font-medium ${
                    card.growth >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {formatPercentage(card.growth)}
                </span>
              </div>
            </div>
            <h3
              className={`text-sm font-medium mb-1 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {card.title}
            </h3>
            <p className="text-2xl font-bold">
              {card.value !== undefined ? card.format(card.value) : "-"}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Chart */}
        <div
          className={`rounded-lg p-6 shadow-sm border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4">Sales Overview (Last 7 Days)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDarkMode ? "#374151" : "#e5e7eb"}
                />
                <XAxis
                  dataKey="date"
                  stroke={isDarkMode ? "#9ca3af" : "#6b7280"}
                />
                <YAxis stroke={isDarkMode ? "#9ca3af" : "#6b7280"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#1f2937" : "#fff",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Chart */}
        <div
          className={`rounded-lg p-6 shadow-sm border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4">Orders Trend</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDarkMode ? "#374151" : "#e5e7eb"}
                />
                <XAxis
                  dataKey="date"
                  stroke={isDarkMode ? "#9ca3af" : "#6b7280"}
                />
                <YAxis stroke={isDarkMode ? "#9ca3af" : "#6b7280"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#1f2937" : "#fff",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="orders" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div
          className={`rounded-lg p-6 shadow-sm border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Orders</h3>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order._id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium">{order.orderNumber}</p>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {order.customerName}
                  </p>
                </div>
                <div className="text-right mr-4">
                  <p className="font-semibold">{formatCurrency(order.total)}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                      order.orderStatus
                    )}`}
                  >
                    {order.orderStatus}
                  </span>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
                <p className="text-center text-gray-500">No recent orders</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div
          className={`rounded-lg p-6 shadow-sm border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Top Products</h3>
          </div>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {product.totalSales} sold
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
                <p className="text-center text-gray-500">No sales data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {stats && (stats.pendingOrders > 0 || stats.lowStockProducts > 0) && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.pendingOrders > 0 && (
            <div
              className={`rounded-lg p-4 border-l-4 border-yellow-500 ${
                isDarkMode ? "bg-yellow-900/20" : "bg-yellow-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Pending Orders</h4>
                  <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                    You have {stats.pendingOrders} orders awaiting processing
                  </p>
                </div>
              </div>
            </div>
          )}
          {stats.lowStockProducts > 0 && (
            <div
              className={`rounded-lg p-4 border-l-4 border-red-500 ${
                isDarkMode ? "bg-red-900/20" : "bg-red-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Low Stock Alert</h4>
                  <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                    {stats.lowStockProducts} products need restocking
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EcommerceDashboard;