import { getDashboardStats } from "@/app/actions/dashboard";
import { auth } from "@/auth";
import EcommerceDashboard from "@/component/dashboard/EcommerceDashboard";

export const metadata = {
  title: "GyneClinics – Expertise Professionalism and Excellence",
  description:
    "We uphold the highest standards of medical ethics, ensuring total confidentiality, safety, and respect for every patient.",
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-USA",
    },
  },
  openGraph: {
    images: "/opengraph-image.jpg",
  },
};

const page = async () => {
  const session = await auth();
  const response = await getDashboardStats();

  const defaultData = {
    stats: {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      revenueGrowth: 0,
      ordersGrowth: 0,
      productsGrowth: 0,
      customersGrowth: 0,
      pendingOrders: 0,
      lowStockProducts: 0,
    },
    recentOrders: [],
    topProducts: [],
    salesData: [],
  };

  const dashboardData = response.success && response.data ? response.data : defaultData;

  return (
    <div>
      <EcommerceDashboard
        session={session?.user?.name ?? undefined}
        data={dashboardData}
      />
    </div>
  );
};

export default page;