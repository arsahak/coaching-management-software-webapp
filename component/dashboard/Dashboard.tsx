"use client";
import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import { getTranslation } from "@/lib/translations";
import {
  IoMdAnalytics,
  IoMdCalendar,
  IoMdCard,
  IoMdDocument,
  IoMdPeople,
  IoMdSettings,
  IoMdTrendingDown,
  IoMdTrendingUp,
} from "react-icons/io";
import { MdAttachMoney, MdShoppingCart } from "react-icons/md";

const Dashboard = ({ session }: { session?: string }) => {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();

  console.log(session);

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
              {/* Total Sales */}
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
                      {getTranslation("totalSales", language)}
                    </p>
                    <p className="text-white text-2xl font-bold mt-1">
                      $48,988,078
                    </p>
                    <div className="flex items-center mt-2">
                      <IoMdTrendingUp className="w-4 h-4 text-green-300 mr-1" />
                      <span className="text-green-300 text-sm font-medium">
                        ↑ +22%
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <IoMdDocument className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Total Sales Return */}
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
                      {getTranslation("totalSalesReturn", language)}
                    </p>
                    <p className="text-white text-2xl font-bold mt-1">
                      $16,478,145
                    </p>
                    <div className="flex items-center mt-2">
                      <IoMdTrendingDown className="w-4 h-4 text-red-300 mr-1" />
                      <span className="text-red-300 text-sm font-medium">
                        ↓ -22%
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <IoMdCard className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Total Purchase */}
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
                      {getTranslation("totalPurchase", language)}
                    </p>
                    <p className="text-white text-2xl font-bold mt-1">
                      $24,145,789
                    </p>
                    <div className="flex items-center mt-2">
                      <IoMdTrendingUp className="w-4 h-4 text-green-300 mr-1" />
                      <span className="text-green-300 text-sm font-medium">
                        ↑ +22%
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <MdShoppingCart className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Total Purchase Return */}
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
                      {getTranslation("totalPurchaseReturn", language)}
                    </p>
                    <p className="text-white text-2xl font-bold mt-1">
                      $18,458,747
                    </p>
                    <div className="flex items-center mt-2">
                      <IoMdTrendingUp className="w-4 h-4 text-green-300 mr-1" />
                      <span className="text-green-300 text-sm font-medium">
                        ↑ +22%
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <IoMdAnalytics className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                      {getTranslation("profit", language)}
                    </p>
                    <p
                      className={`text-2xl font-bold mt-1 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      $8,458,798
                    </p>
                    <div className="flex items-center mt-2">
                      <IoMdTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-500 text-sm font-medium">
                        +35% vs Last Month
                      </span>
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-full transition-colors duration-200 ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <MdAttachMoney
                      className={`w-6 h-6 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    />
                  </div>
                </div>
              </div>

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
                      {getTranslation("invoiceDue", language)}
                    </p>
                    <p
                      className={`text-2xl font-bold mt-1 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      $48,988,78
                    </p>
                    <div className="flex items-center mt-2">
                      <IoMdTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-500 text-sm font-medium">
                        +35% vs Last Month
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
                      {getTranslation("totalExpenses", language)}
                    </p>
                    <p
                      className={`text-2xl font-bold mt-1 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      $8,980,097
                    </p>
                    <div className="flex items-center mt-2">
                      <IoMdTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-500 text-sm font-medium">
                        +41% vs Last Month
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
                      {getTranslation("totalPaymentReturns", language)}
                    </p>
                    <p
                      className={`text-2xl font-bold mt-1 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      $78,458,798
                    </p>
                    <div className="flex items-center mt-2">
                      <IoMdTrendingDown className="w-4 h-4 text-red-500 mr-1" />
                      <span className="text-red-500 text-sm font-medium">
                        -20% vs Last Month
                      </span>
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-full transition-colors duration-200 ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <IoMdCard
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
              {/* Sales & Purchase Chart */}
              <div
                className={`lg:col-span-2 p-6 rounded-xl shadow-md transition-colors duration-200 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <MdShoppingCart
                      className={`w-5 h-5 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    />
                    <h3
                      className={`text-lg font-semibold transition-colors duration-200 ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {getTranslation("salesPurchase", language)}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    {["1D", "1W", "1M", "3M", "6M", "1Y"].map((period) => (
                      <button
                        key={period}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors duration-200 ${
                          period === "1Y"
                            ? "bg-orange-500 text-white"
                            : isDarkMode
                            ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Placeholder Chart */}
                <div
                  className={`h-64 rounded-lg transition-colors duration-200 ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  } flex items-center justify-center`}
                >
                  <div className="text-center">
                    <IoMdAnalytics
                      className={`w-12 h-12 mx-auto mb-2 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    />
                    <p
                      className={`text-sm transition-colors duration-200 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Chart visualization coming soon
                    </p>
                  </div>
                </div>
              </div>

              {/* Overall Information */}
              <div className="space-y-6">
                {/* Overall Info Cards */}
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
                    {getTranslation("overallInformation", language)}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
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
                          {getTranslation("suppliers", language)}
                        </span>
                      </div>
                      <span
                        className={`text-lg font-bold transition-colors duration-200 ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        6987
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
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
                          {getTranslation("customer", language)}
                        </span>
                      </div>
                      <span
                        className={`text-lg font-bold transition-colors duration-200 ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        4896
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
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
                          {getTranslation("orders", language)}
                        </span>
                      </div>
                      <span
                        className={`text-lg font-bold transition-colors duration-200 ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        487
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customers Overview */}
                <div
                  className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className={`text-lg font-semibold transition-colors duration-200 ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {getTranslation("customersOverview", language)}
                    </h3>
                    <select
                      className={`text-sm px-2 py-1 rounded-lg transition-colors duration-200 ${
                        isDarkMode
                          ? "bg-gray-700 text-gray-300 border border-gray-600"
                          : "bg-white text-gray-700 border border-gray-300"
                      }`}
                    >
                      <option>Today</option>
                      <option>This Week</option>
                      <option>This Month</option>
                    </select>
                  </div>

                  {/* Placeholder Chart */}
                  <div
                    className={`h-32 rounded-lg transition-colors duration-200 ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-100"
                    } flex items-center justify-center mb-4`}
                  >
                    <div className="text-center">
                      <IoMdAnalytics
                        className={`w-8 h-8 mx-auto mb-1 transition-colors duration-200 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <p
                        className={`text-xs transition-colors duration-200 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Chart
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                        <span
                          className={`text-sm font-medium transition-colors duration-200 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {getTranslation("firstTime", language)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-lg font-bold transition-colors duration-200 ${
                            isDarkMode ? "text-gray-100" : "text-gray-900"
                          }`}
                        >
                          5.5K
                        </span>
                        <div className="flex items-center">
                          <IoMdTrendingUp className="w-3 h-3 text-green-500 mr-1" />
                          <span className="text-green-500 text-xs">K 25%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span
                          className={`text-sm font-medium transition-colors duration-200 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {getTranslation("return", language)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-lg font-bold transition-colors duration-200 ${
                            isDarkMode ? "text-gray-100" : "text-gray-900"
                          }`}
                        >
                          3.5K
                        </span>
                        <div className="flex items-center">
                          <IoMdTrendingUp className="w-3 h-3 text-green-500 mr-1" />
                          <span className="text-green-500 text-xs">K 21%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        </div>
      </div>
    </>
  );
};
export default Dashboard;
