"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Dashboard data interfaces
export interface DashboardOverview {
  totalStudents: number;
  totalTeachers: number;
  newAdmissionsThisMonth: number;
  pendingAdmissions: number;
  inactiveStudents: number;
  monthlyRevenue: number;
  avgMonthlyFee: number;
}

export interface DashboardGrowth {
  studentGrowth: number;
  admissionGrowth: number;
}

export interface ClassDistribution {
  _id: string;
  count: number;
}

export interface BatchDistribution {
  _id: string;
  count: number;
}

export interface RecentAdmission {
  _id: string;
  name: string;
  class: string;
  batch: string;
  admissionDate: string;
  status: string;
}

export interface MonthlyTrend {
  _id: {
    year: number;
    month: number;
  };
  count: number;
  revenue: number;
}

export interface DashboardData {
  overview: DashboardOverview;
  growth: DashboardGrowth;
  distribution: {
    byClass: ClassDistribution[];
    byBatch: BatchDistribution[];
  };
  recentAdmissions: RecentAdmission[];
  monthlyTrends: MonthlyTrend[];
}

export interface DashboardResponse {
  success: boolean;
  data?: DashboardData;
  error?: string;
  message?: string;
}

// Helper function to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const token = session?.accessToken;

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Get dashboard overview
export async function getDashboardOverview(): Promise<DashboardResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/dashboard/overview`, {
      method: "GET",
      headers,
      cache: "no-store", // Don't cache dashboard data
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
      data: data.data,
    };
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard data",
    };
  }
}

// Get quick stats
export async function getQuickStats(): Promise<{
  success: boolean;
  data?: {
    totalActive: number;
    totalPending: number;
    totalTeachers: number;
  };
  error?: string;
}> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/dashboard/quick-stats`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch stats",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error fetching quick stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch stats",
    };
  }
}
