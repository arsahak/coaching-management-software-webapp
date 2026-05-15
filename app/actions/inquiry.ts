"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type InquiryStatus = "pending" | "contacted" | "enrolled" | "rejected";

export interface Inquiry {
  _id: string;
  studentName: string;
  parentName: string;
  phone: string;
  email?: string;
  desiredClass: string;
  message?: string;
  status: InquiryStatus;
  source: "website";
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InquiryStats {
  pending: number;
  contacted: number;
  enrolled: number;
  rejected: number;
  total: number;
}

async function getAuthHeaders() {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Unauthorized");
  }
  return {
    Authorization: `Bearer ${session.accessToken}`,
    "Content-Type": "application/json",
  };
}

export async function getInquiries(
  page = 1,
  limit = 10,
  search = "",
  status?: InquiryStatus
) {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.set("search", search);
    if (status) params.set("status", status);

    const response = await fetch(`${API_URL}/api/inquiry?${params}`, {
      headers,
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch inquiries",
      };
    }

    return {
      success: true,
      data: data.data as Inquiry[],
      pagination: data.pagination,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch inquiries",
    };
  }
}

export async function getInquiryStats() {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/inquiry/stats`, {
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

    return { success: true, data: data.data as InquiryStats };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch stats",
    };
  }
}

export async function updateInquiry(
  id: string,
  payload: { status?: InquiryStatus; adminNotes?: string }
) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/inquiry/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to update inquiry",
      };
    }

    return {
      success: true,
      message: data.message,
      data: data.data as Inquiry,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update inquiry",
    };
  }
}

export async function deleteInquiry(id: string) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/inquiry/${id}`, {
      method: "DELETE",
      headers,
    });
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to delete inquiry",
      };
    }

    return { success: true, message: data.message };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete inquiry",
    };
  }
}
