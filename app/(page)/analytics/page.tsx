import { getCustomerStats } from "@/app/actions/customer";
import { getOrderStats, getRecentOrders } from "@/app/actions/order";
import AnalyticsManagement from "@/component/analytics/AnalyticsManagement";

const AnalyticsPage = async () => {
  const [orderStatsRes, customerStatsRes, recentOrdersRes] = await Promise.all([
    getOrderStats(),
    getCustomerStats(),
    getRecentOrders(),
  ]);

  const orderStats = orderStatsRes.success ? orderStatsRes.data : {
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    revenue: 0,
  };

  const customerStats = customerStatsRes.success ? customerStatsRes.data : {
    totalCustomers: 0,
    newCustomersThisMonth: 0,
    topCustomers: [],
  };

  const recentOrders = recentOrdersRes.success ? recentOrdersRes.data : [];

  return (
    <AnalyticsManagement
      orderStats={orderStats as any}
      customerStats={customerStats as any}
      recentOrders={recentOrders as any[]}
    />
  );
};

export default AnalyticsPage;