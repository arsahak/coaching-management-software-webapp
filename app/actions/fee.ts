"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface FeeData {
  admissionId: string;
  monthlyFee: number;
  dueDate: string;
  month: number;
  year: number;
  notes?: string;
}

export interface FeeUpdateData {
  amountPaid?: number;
  paymentDate?: string;
  paymentMethod?: "cash" | "bank" | "mobile_banking" | "other";
  transactionId?: string;
  notes?: string;
  sendSms?: boolean;
}

export interface FeeResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
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

// Create fee record
export async function createFee(feeData: FeeData): Promise<FeeResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/fee`, {
      method: "POST",
      headers,
      body: JSON.stringify(feeData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to create fee record",
      };
    }

    return {
      success: true,
      message: data.message || "Fee record created successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Create fee error:", error);
    return {
      success: false,
      error: "An error occurred while creating fee record",
    };
  }
}

// Create bulk fees
export async function createBulkFees(
  month: number,
  year: number,
  dueDate: string,
  classFilter?: string,
  batchName?: string
): Promise<FeeResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/fee/bulk`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        month,
        year,
        dueDate,
        class: classFilter,
        batchName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to create bulk fees",
      };
    }

    return {
      success: true,
      message: data.message || "Bulk fees created successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Create bulk fees error:", error);
    return {
      success: false,
      error: "An error occurred while creating bulk fees",
    };
  }
}

// Get fees
export async function getFees(
  page: number = 1,
  limit: number = 50,
  filters?: {
    admissionId?: string;
    studentId?: string;
    month?: number;
    year?: number;
    status?: "pending" | "paid" | "overdue" | "partial";
    class?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<FeeResponse> {
  try {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.admissionId && { admissionId: filters.admissionId }),
      ...(filters?.studentId && { studentId: filters.studentId }),
      ...(filters?.month && { month: filters.month.toString() }),
      ...(filters?.year && { year: filters.year.toString() }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.class && { class: filters.class }),
      ...(filters?.startDate && { startDate: filters.startDate }),
      ...(filters?.endDate && { endDate: filters.endDate }),
    });

    const response = await fetch(`${API_URL}/api/fee?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch fees",
      };
    }

    return {
      success: true,
      data: data.data,
      pagination: data.pagination,
    };
  } catch (error) {
    console.error("Get fees error:", error);
    return {
      success: false,
      error: "An error occurred while fetching fees",
    };
  }
}

// Get single fee by ID
export async function getFeeById(id: string): Promise<FeeResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/fee/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch fee",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Get fee by ID error:", error);
    return {
      success: false,
      error: "An error occurred while fetching fee",
    };
  }
}

// Update fee
export async function updateFee(
  id: string,
  updateData: FeeUpdateData
): Promise<FeeResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/fee/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to update fee",
      };
    }

    return {
      success: true,
      message: data.message || "Fee updated successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Update fee error:", error);
    return {
      success: false,
      error: "An error occurred while updating fee",
    };
  }
}

// Delete fee
export async function deleteFee(id: string): Promise<FeeResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/fee/${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to delete fee",
      };
    }

    return {
      success: true,
      message: data.message || "Fee deleted successfully",
    };
  } catch (error) {
    console.error("Delete fee error:", error);
    return {
      success: false,
      error: "An error occurred while deleting fee",
    };
  }
}

// Send payment reminder SMS
export async function sendPaymentReminderSMS(
  feeId?: string,
  admissionId?: string,
  studentId?: string
): Promise<FeeResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/fee/reminder/sms`, {
      method: "POST",
      headers,
      body: JSON.stringify({ feeId, admissionId, studentId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to send payment reminder SMS",
      };
    }

    return {
      success: true,
      message: data.message || "Payment reminder SMS sent successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Send payment reminder SMS error:", error);
    return {
      success: false,
      error: "An error occurred while sending payment reminder SMS",
    };
  }
}

// Send overdue SMS
export async function sendOverdueSMS(
  feeId?: string,
  admissionId?: string,
  studentId?: string
): Promise<FeeResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/fee/overdue/sms`, {
      method: "POST",
      headers,
      body: JSON.stringify({ feeId, admissionId, studentId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to send overdue SMS",
      };
    }

    return {
      success: true,
      message: data.message || "Overdue SMS sent successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Send overdue SMS error:", error);
    return {
      success: false,
      error: "An error occurred while sending overdue SMS",
    };
  }
}

// Send payment confirmation SMS
export async function sendPaymentConfirmationSMS(
  feeId: string
): Promise<FeeResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/fee/payment/sms`, {
      method: "POST",
      headers,
      body: JSON.stringify({ feeId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to send payment confirmation SMS",
      };
    }

    return {
      success: true,
      message: data.message || "Payment confirmation SMS sent successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Send payment confirmation SMS error:", error);
    return {
      success: false,
      error: "An error occurred while sending payment confirmation SMS",
    };
  }
}

// Get fee statistics
export async function getFeeStats(
  month?: number,
  year?: number,
  classFilter?: string
): Promise<FeeResponse> {
  try {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams();
    if (month) params.append("month", month.toString());
    if (year) params.append("year", year.toString());
    if (classFilter) params.append("class", classFilter);

    const response = await fetch(`${API_URL}/api/fee/stats?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch fee statistics",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Get fee stats error:", error);
    return {
      success: false,
      error: "An error occurred while fetching fee statistics",
    };
  }
}
