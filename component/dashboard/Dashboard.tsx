"use client";
import { DashboardData, getDashboardOverview } from "@/app/actions/dashboard";
import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import { getTranslation } from "@/lib/translations";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  IoMdAnalytics,
  IoMdCalendar,
  IoMdDocument,
  IoMdPeople,
  IoMdSettings,
  IoMdTrendingDown,
  IoMdTrendingUp,
} from "react-icons/io";
import { MdAttachMoney, MdShoppingCart } from "react-icons/md";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const Dashboard = ({ session }: { session?: string }) => {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const result = await getDashboardOverview();
      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        toast.error(result.error || "Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  // Format monthly trends data for charts
  const getChartData = () => {
    if (!dashboardData?.monthlyTrends) return [];
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return dashboardData.monthlyTrends.map((trend) => ({
      month: `${monthNames[trend._id.month - 1]} ${trend._id.year}`,
      admissions: trend.count,
      revenue: trend.revenue,
    }));
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`p-3 rounded-lg shadow-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <p
            className={`font-medium mb-2 ${
              isDarkMode ? "text-gray-200" : "text-gray-800"
            }`}
          >
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className={`text-sm ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
              style={{ color: entry.color }}
            >
              {entry.name}:{" "}
              {entry.name === "Revenue"
                ? formatCurrency(entry.value)
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`min-h-screen transition-colors duration-200 ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="p-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1
                className={`text-3xl font-bold transition-colors duration-200 ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {getTranslation("welcomeAdmin", language)}
              </h1>
              <p
                className={`text-sm mt-1 transition-colors duration-200 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {getTranslation("ordersToday", language)}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 lg:mt-0">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode
                    ? "bg-gray-800 text-gray-300 border border-gray-700"
                    : "bg-white text-gray-700 border border-gray-200"
                }`}
              >
                <IoMdCalendar className="w-4 h-4" />
                <span className="text-sm font-medium">
                  10/20/2025 - 10/26/2025
                </span>
              </div>
              <button
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <IoMdSettings className="w-5 h-5" />
              </button>
            </div>
          </div>

          <>
            {/* Main KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Students */}
              <div
                className={`p-6 rounded-xl shadow-lg transition-colors duration-200 ${
                  isDarkMode
                    ? "bg-gradient-to-br from-orange-500 to-orange-600"
                    : "bg-gradient-to-br from-orange-400 to-orange-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">
                      Total Students
                    </p>
                    <p className="text-white text-2xl font-bold mt-1">
                      {dashboardData?.overview.totalStudents || 0}
                    </p>
                    <div className="flex items-center mt-2">
                      {(dashboardData?.growth.studentGrowth || 0) >= 0 ? (
                        <IoMdTrendingUp className="w-4 h-4 text-green-300 mr-1" />
                      ) : (
                        <IoMdTrendingDown className="w-4 h-4 text-red-300 mr-1" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          (dashboardData?.growth.studentGrowth || 0) >= 0
                            ? "text-green-300"
                            : "text-red-300"
                        }`}
                      >
                        {formatPercentage(
                          dashboardData?.growth.studentGrowth || 0
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <IoMdPeople className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* New Admissions This Month */}
              <div
                className={`p-6 rounded-xl shadow-lg transition-colors duration-200 ${
                  isDarkMode
                    ? "bg-gradient-to-br from-blue-600 to-blue-700"
                    : "bg-gradient-to-br from-blue-500 to-blue-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
                      New Admissions
                    </p>
                    <p className="text-white text-2xl font-bold mt-1">
                      {dashboardData?.overview.newAdmissionsThisMonth || 0}
                    </p>
                    <div className="flex items-center mt-2">
                      {(dashboardData?.growth.admissionGrowth || 0) >= 0 ? (
                        <IoMdTrendingUp className="w-4 h-4 text-green-300 mr-1" />
                      ) : (
                        <IoMdTrendingDown className="w-4 h-4 text-red-300 mr-1" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          (dashboardData?.growth.admissionGrowth || 0) >= 0
                            ? "text-green-300"
                            : "text-red-300"
                        }`}
                      >
                        {formatPercentage(
                          dashboardData?.growth.admissionGrowth || 0
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <IoMdDocument className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Monthly Revenue */}
              <div
                className={`p-6 rounded-xl shadow-lg transition-colors duration-200 ${
                  isDarkMode
                    ? "bg-gradient-to-br from-teal-500 to-teal-600"
                    : "bg-gradient-to-br from-teal-400 to-teal-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-100 text-sm font-medium">
                      Monthly Revenue
                    </p>
                    <p className="text-white text-2xl font-bold mt-1">
                      {formatCurrency(
                        dashboardData?.overview.monthlyRevenue || 0
                      )}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="text-green-300 text-sm font-medium">
                        Avg:{" "}
                        {formatCurrency(
                          dashboardData?.overview.avgMonthlyFee || 0
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <MdAttachMoney className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Total Teachers */}
              <div
                className={`p-6 rounded-xl shadow-lg transition-colors duration-200 ${
                  isDarkMode
                    ? "bg-gradient-to-br from-cyan-500 to-cyan-600"
                    : "bg-gradient-to-br from-cyan-400 to-cyan-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cyan-100 text-sm font-medium">
                      Total Teachers
                    </p>
                    <p className="text-white text-2xl font-bold mt-1">
                      {dashboardData?.overview.totalTeachers || 0}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="text-white text-xs opacity-75">
                        Active Staff
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <IoMdPeople className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary KPI Cards - Class & Batch Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Pending Admissions */}
              <div
                className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm font-medium transition-colors duration-200 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Pending Admissions
                    </p>
                    <p
                      className={`text-2xl font-bold mt-1 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {dashboardData?.overview.pendingAdmissions || 0}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="text-yellow-500 text-sm font-medium">
                        Needs Review
                      </span>
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-full transition-colors duration-200 ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <IoMdDocument
                      className={`w-6 h-6 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Total Classes */}
              <div
                className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm font-medium transition-colors duration-200 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Total Classes
                    </p>
                    <p
                      className={`text-2xl font-bold mt-1 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {dashboardData?.distribution.byClass.length || 0}
                    </p>
                    <div className="flex items-center mt-2">
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Active Classes
                      </span>
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-full transition-colors duration-200 ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <IoMdAnalytics
                      className={`w-6 h-6 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Total Batches */}
              <div
                className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm font-medium transition-colors duration-200 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Total Batches
                    </p>
                    <p
                      className={`text-2xl font-bold mt-1 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {dashboardData?.distribution.byBatch.length || 0}
                    </p>
                    <div className="flex items-center mt-2">
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Running Batches
                      </span>
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-full transition-colors duration-200 ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <MdShoppingCart
                      className={`w-6 h-6 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Additional Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Admissions Trend Chart */}
              <div
                className={`lg:col-span-2 p-6 rounded-xl shadow-md transition-colors duration-200 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <IoMdAnalytics
                      className={`w-5 h-5 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    />
                    <h3
                      className={`text-lg font-semibold transition-colors duration-200 ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      Admission Trends (Last 6 Months)
                    </h3>
                  </div>
                </div>

                {/* Admissions & Revenue Chart */}
                {getChartData().length > 0 ? (
                  <div className="space-y-6">
                    {/* Admissions Line Chart */}
                    <div>
                      <p
                        className={`text-sm font-medium mb-3 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Monthly Admissions
                      </p>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={getChartData()}>
                          <defs>
                            <linearGradient
                              id="colorAdmissions"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#3b82f6"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#3b82f6"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDarkMode ? "#374151" : "#e5e7eb"}
                          />
                          <XAxis
                            dataKey="month"
                            stroke={isDarkMode ? "#9ca3af" : "#6b7280"}
                            style={{ fontSize: "12px" }}
                          />
                          <YAxis
                            stroke={isDarkMode ? "#9ca3af" : "#6b7280"}
                            style={{ fontSize: "12px" }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="admissions"
                            stroke="#3b82f6"
                            fillOpacity={1}
                            fill="url(#colorAdmissions)"
                            name="Admissions"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Revenue Bar Chart */}
                    <div>
                      <p
                        className={`text-sm font-medium mb-3 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Monthly Revenue
                      </p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={getChartData()}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDarkMode ? "#374151" : "#e5e7eb"}
                          />
                          <XAxis
                            dataKey="month"
                            stroke={isDarkMode ? "#9ca3af" : "#6b7280"}
                            style={{ fontSize: "12px" }}
                          />
                          <YAxis
                            stroke={isDarkMode ? "#9ca3af" : "#6b7280"}
                            style={{ fontSize: "12px" }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="revenue"
                            fill="#14b8a6"
                            name="Revenue"
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`h-96 rounded-lg flex items-center justify-center ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <div className="text-center">
                      <IoMdAnalytics
                        className={`w-12 h-12 mx-auto mb-2 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        No trend data available
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Overall Information */}
              <div className="space-y-6">
                {/* Class Distribution */}
                <div
                  className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <h3
                    className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Students by Class
                  </h3>
                  <div className="space-y-3">
                    {dashboardData?.distribution.byClass.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                              isDarkMode ? "bg-gray-700" : "bg-gray-100"
                            }`}
                          >
                            <IoMdPeople
                              className={`w-5 h-5 transition-colors duration-200 ${
                                isDarkMode ? "text-gray-300" : "text-gray-600"
                              }`}
                            />
                          </div>
                          <span
                            className={`font-medium transition-colors duration-200 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Class {item._id}
                          </span>
                        </div>
                        <span
                          className={`text-lg font-bold transition-colors duration-200 ${
                            isDarkMode ? "text-gray-100" : "text-gray-900"
                          }`}
                        >
                          {item.count}
                        </span>
                      </div>
                    ))}
                    {(!dashboardData?.distribution.byClass ||
                      dashboardData.distribution.byClass.length === 0) && (
                      <p
                        className={`text-sm text-center py-4 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        No class data available
                      </p>
                    )}
                  </div>
                </div>

                {/* Batch Distribution */}
                <div
                  className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <h3
                    className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Students by Batch
                  </h3>
                  <div className="space-y-3">
                    {dashboardData?.distribution.byBatch
                      .slice(0, 5)
                      .map((item) => (
                        <div
                          key={item._id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg transition-colors duration-200 ${
                                isDarkMode ? "bg-gray-700" : "bg-gray-100"
                              }`}
                            >
                              <MdShoppingCart
                                className={`w-5 h-5 transition-colors duration-200 ${
                                  isDarkMode ? "text-gray-300" : "text-gray-600"
                                }`}
                              />
                            </div>
                            <span
                              className={`font-medium transition-colors duration-200 ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              Batch {item._id}
                            </span>
                          </div>
                          <span
                            className={`text-lg font-bold transition-colors duration-200 ${
                              isDarkMode ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            {item.count}
                          </span>
                        </div>
                      ))}
                    {(!dashboardData?.distribution.byBatch ||
                      dashboardData.distribution.byBatch.length === 0) && (
                      <p
                        className={`text-sm text-center py-4 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        No batch data available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Admissions Table */}
            <div
              className={`rounded-xl shadow-md p-6 transition-colors duration-200 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <IoMdDocument
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  />
                  <h3
                    className={`text-lg font-semibold transition-colors duration-200 ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Recent Admissions
                  </h3>
                </div>
              </div>

              {/* Admissions Table */}
              <div className="overflow-x-auto">
                {dashboardData?.recentAdmissions &&
                dashboardData.recentAdmissions.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr
                        className={`border-b ${
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        }`}
                      >
                        <th
                          className={`text-left py-3 px-4 text-sm font-medium ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Student Name
                        </th>
                        <th
                          className={`text-left py-3 px-4 text-sm font-medium ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Class
                        </th>
                        <th
                          className={`text-left py-3 px-4 text-sm font-medium ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Batch
                        </th>
                        <th
                          className={`text-left py-3 px-4 text-sm font-medium ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Status
                        </th>
                        <th
                          className={`text-left py-3 px-4 text-sm font-medium ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.recentAdmissions.map((admission) => (
                        <tr
                          key={admission._id}
                          className={`border-b transition-colors ${
                            isDarkMode
                              ? "border-gray-700 hover:bg-gray-750"
                              : "border-gray-100 hover:bg-gray-50"
                          }`}
                        >
                          <td
                            className={`py-3 px-4 ${
                              isDarkMode ? "text-gray-200" : "text-gray-800"
                            }`}
                          >
                            {admission.name}
                          </td>
                          <td
                            className={`py-3 px-4 ${
                              isDarkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {admission.class}
                          </td>
                          <td
                            className={`py-3 px-4 ${
                              isDarkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {admission.batch}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                admission.status === "active"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : admission.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {admission.status}
                            </span>
                          </td>
                          <td
                            className={`py-3 px-4 text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {new Date(
                              admission.admissionDate
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div
                    className={`p-8 rounded-lg text-center ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <IoMdDocument
                      className={`w-12 h-12 mx-auto mb-2 ${
                        isDarkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    />
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      No recent admissions
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        </div>
      </div>
    </>
  );
};
export default Dashboard;
