"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface SMSData {
  mobileNumber?: string;
  mobileNumbers?: string[];
  message: string;
  senderId?: string;
  apiKey?: string;
  messages?: Array<{ number: string; message: string }>;
  filters?: {
    class?: string;
    batchName?: string;
    studentId?: string;
  };
}

export interface SMSResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
  code?: number;
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

// Send single SMS
export async function sendSingleSMS(smsData: {
  mobileNumber: string;
  message: string;
  senderId?: string;
  apiKey?: string;
}): Promise<SMSResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/sms/send`, {
      method: "POST",
      headers,
      body: JSON.stringify(smsData),
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found. Status: ${response.status}. Please ensure the backend SMS API is implemented.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to send SMS",
      };
    }

    return {
      success: true,
      message: data.message || "SMS sent successfully",
      data: data.data,
      code: data.code,
    };
  } catch (error) {
    console.error("Send single SMS error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while sending SMS",
    };
  }
}

// Send bulk SMS (same message to multiple numbers)
export async function sendBulkSMS(smsData: {
  mobileNumbers: string[];
  message: string;
  senderId?: string;
  apiKey?: string;
}): Promise<SMSResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/sms/bulk`, {
      method: "POST",
      headers,
      body: JSON.stringify(smsData),
    });

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found. Status: ${response.status}. Please ensure the backend SMS API is implemented.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to send bulk SMS",
      };
    }

    return {
      success: true,
      message: data.message || "Bulk SMS sent successfully",
      data: data.data,
      code: data.code,
    };
  } catch (error) {
    console.error("Send bulk SMS error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while sending bulk SMS",
    };
  }
}

// Send bulk SMS with different messages
export async function sendBulkSMSCustom(smsData: {
  messages: Array<{ number: string; message: string }>;
  senderId?: string;
  apiKey?: string;
}): Promise<SMSResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/sms/bulk/custom`, {
      method: "POST",
      headers,
      body: JSON.stringify(smsData),
    });

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found. Status: ${response.status}. Please ensure the backend SMS API is implemented.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to send bulk SMS",
      };
    }

    return {
      success: true,
      message: data.message || "Bulk SMS sent successfully",
      data: data.data,
      code: data.code,
    };
  } catch (error) {
    console.error("Send bulk SMS custom error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while sending bulk SMS",
    };
  }
}

// Send SMS to students by filter
export async function sendSMSToStudents(smsData: {
  message: string;
  filters?: {
    class?: string;
    batchName?: string;
    studentId?: string;
  };
  senderId?: string;
  apiKey?: string;
}): Promise<SMSResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/sms/send/students`, {
      method: "POST",
      headers,
      body: JSON.stringify(smsData),
    });

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found. Status: ${response.status}. Please ensure the backend SMS API is implemented.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to send SMS to students",
      };
    }

    return {
      success: true,
      message: data.message || "SMS sent to students successfully",
      data: data.data,
      code: data.code,
    };
  } catch (error) {
    console.error("Send SMS to students error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while sending SMS to students",
    };
  }
}

// Get SMS history
export async function getSMSHistory(
  page: number = 1,
  limit: number = 50,
  filters?: {
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }
): Promise<SMSResponse> {
  try {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.startDate && { startDate: filters.startDate }),
      ...(filters?.endDate && { endDate: filters.endDate }),
      ...(filters?.search && { search: filters.search }),
    });

    const response = await fetch(`${API_URL}/api/sms?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found. Status: ${response.status}. Please ensure the backend SMS API is implemented.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch SMS history",
      };
    }

    return {
      success: true,
      data: data.data,
      pagination: data.pagination,
    };
  } catch (error) {
    console.error("Get SMS history error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while fetching SMS history",
    };
  }
}

// Get SMS statistics
export async function getSMSStats(filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<SMSResponse> {
  try {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      ...(filters?.startDate && { startDate: filters.startDate }),
      ...(filters?.endDate && { endDate: filters.endDate }),
    });

    const response = await fetch(`${API_URL}/api/sms/stats?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found. Status: ${response.status}. Please ensure the backend SMS API is implemented.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch SMS statistics",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Get SMS stats error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while fetching SMS statistics",
    };
  }
}
