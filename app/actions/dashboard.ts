"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface DashboardData {
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

export async function getDashboardStats() {
  try {
    const session = await auth();
    const token = session?.accessToken;

    const response = await fetch(`${API_URL}/api/dashboard/overview`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch dashboard data",
      };
    }

    return {
      success: true,
      data: data.data as DashboardData,
    };
  } catch (error: any) {
    console.error("Dashboard Stats Action Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}